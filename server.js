const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from dist folder (built frontend)
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static('uploads'));
app.use('/outputs', express.static('outputs'));

// Create directories on startup
const createDirectories = async () => {
  const dirs = ['uploads', 'outputs', 'temp'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') console.error(`Error creating ${dir}:`, err);
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for mobile compatibility
  },
  fileFilter: (req, file, cb) => {
    const allowedImages = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedImages.test(ext.substring(1))) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP images are allowed'));
    }
  }
});

// Simple face detection (center region)
const detectFace = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    // Use center region as face area
    const faceRegion = {
      left: Math.floor(metadata.width * 0.25),
      top: Math.floor(metadata.height * 0.2),
      width: Math.floor(metadata.width * 0.5),
      height: Math.floor(metadata.height * 0.6)
    };
    
    return {
      detected: true,
      region: faceRegion,
      metadata
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      detected: false,
      error: error.message
    };
  }
};

// Swap face in image
const swapFaceInImage = async (sourceFacePath, targetImagePath, outputPath) => {
  try {
    const sourceFace = await detectFace(sourceFacePath);
    const targetFace = await detectFace(targetImagePath);
    
    if (!sourceFace.detected) {
      throw new Error('No face detected in source image');
    }
    
    if (!targetFace.detected) {
      throw new Error('No face detected in target image');
    }
    
    // Extract and resize source face
    const sourceFaceBuffer = await sharp(sourceFacePath)
      .extract(sourceFace.region)
      .resize(targetFace.region.width, targetFace.region.height, {
        fit: 'cover'
      })
      .toBuffer();
    
    // Read target image
    const targetBuffer = await sharp(targetImagePath).toBuffer();
    
    // Composite face swap
    await sharp(targetBuffer)
      .composite([{
        input: sourceFaceBuffer,
        top: targetFace.region.top,
        left: targetFace.region.left,
        blend: 'over'
      }])
      .resize(1024, null, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    return { success: true, outputPath };
  } catch (error) {
    console.error('Face swap error:', error);
    return { success: false, error: error.message };
  }
};

// Cleanup old files (runs every hour)
const cleanupOldFiles = async () => {
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  const dirs = ['uploads', 'outputs', 'temp'];
  
  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (Date.now() - stats.mtimeMs > maxAge) {
          await fs.rm(filePath, { recursive: true, force: true });
          console.log(`Cleaned up: ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`Cleanup error in ${dir}:`, error);
    }
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'FaceSwap Lite API is running'
  });
});

// Process batch photos
app.post('/api/process-photos', 
  upload.fields([
    { name: 'sourceFace', maxCount: 1 },
    { name: 'targetImages', maxCount: 20 }
  ]),
  async (req, res) => {
    console.log('📸 Processing photos request...');
    
    try {
      if (!req.files || !req.files['sourceFace'] || !req.files['targetImages']) {
        return res.status(400).json({ 
          error: 'Please upload both source face and target images' 
        });
      }

      const sourceFace = req.files['sourceFace'][0];
      const targetImages = req.files['targetImages'];
      
      console.log(`Processing ${targetImages.length} images with source face`);
      
      const results = [];
      
      for (let i = 0; i < targetImages.length; i++) {
        const target = targetImages[i];
        const outputFilename = `swapped_${Date.now()}_${i}.jpg`;
        const outputPath = path.join('outputs', outputFilename);
        
        console.log(`Processing image ${i + 1}/${targetImages.length}`);
        
        const result = await swapFaceInImage(
          sourceFace.path,
          target.path,
          outputPath
        );
        
        if (result.success) {
          results.push({
            original: target.originalname,
            processed: outputFilename,
            url: `/outputs/${outputFilename}`,
            status: 'success'
          });
        } else {
          results.push({
            original: target.originalname,
            status: 'error',
            error: result.error
          });
        }
      }
      
      // Cleanup uploaded files after 5 seconds
      setTimeout(async () => {
        try {
          await fs.unlink(sourceFace.path);
          for (const target of targetImages) {
            await fs.unlink(target.path);
          }
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 5000);
      
      console.log(`✅ Processed ${results.length} images successfully`);
      
      res.json({ 
        success: true,
        results,
        message: `Successfully processed ${results.filter(r => r.status === 'success').length} images`
      });
      
    } catch (error) {
      console.error('❌ Process photos error:', error);
      res.status(500).json({ 
        error: 'Processing failed: ' + error.message 
      });
    }
  }
);

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Start server
const startServer = async () => {
  try {
    await createDirectories();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('================================');
      console.log('🎭 FaceSwap Lite Server Started');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('================================');
    });
    
    // Run cleanup every hour
    setInterval(cleanupOldFiles, 60 * 60 * 1000);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

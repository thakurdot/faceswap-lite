import React, { useState, useRef } from 'react';
import { Upload, Image, Download, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const FaceSwapLite = () => {
  const [sourceFace, setSourceFace] = useState(null);
  const [sourceFaceFile, setSourceFaceFile] = useState(null);
  const [targetFiles, setTargetFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  
  const sourceFaceRef = useRef(null);
  const targetFilesRef = useRef(null);

  // Process photos with real API call
  const processPhotos = async () => {
    if (!sourceFaceFile || targetFiles.length === 0) {
      setErrors(['Please upload a source face and at least one target image']);
      return;
    }

    setProcessing(true);
    setProgress(0);
    setErrors([]);
    setResults([]);

    try {
      const formData = new FormData();
      
      // Add source face
      formData.append('sourceFace', sourceFaceFile);
      
      // Add target images
      for (let i = 0; i < targetFiles.length; i++) {
        formData.append('targetImages', targetFiles[i].file);
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 500);
      
      // Make API request
      const response = await fetch('/api/process-photos', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }
      
      const data = await response.json();
      
      if (data.success && data.results) {
        setResults(data.results);
        setProgress(100);
      } else {
        throw new Error('No results returned');
      }
    } catch (error) {
      console.error('Processing error:', error);
      setErrors([error.message || 'Processing failed. Please try again.']);
    } finally {
      setProcessing(false);
    }
  };

  const handleSourceFaceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(['Source face image must be under 10MB']);
        return;
      }
      
      setSourceFaceFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setSourceFace(e.target.result);
      reader.readAsDataURL(file);
      setErrors([]);
    }
  };

  const handleTargetFilesUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 20);
    
    // Validate files
    const validFiles = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors([`${file.name} is too large (max 10MB)`]);
        continue;
      }
      const preview = URL.createObjectURL(file);
      validFiles.push({ file, preview, name: file.name });
    }
    
    setTargetFiles(prev => [...prev, ...validFiles].slice(0, 20));
    setErrors([]);
  };

  const removeTargetFile = (index) => {
    setTargetFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadResult = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const downloadAllResults = () => {
    results.forEach((result, i) => {
      if (result.status === 'success') {
        setTimeout(() => downloadResult(result.url, `swapped_${i + 1}.jpg`), i * 100);
      }
    });
  };

  const reset = () => {
    setSourceFace(null);
    setSourceFaceFile(null);
    setTargetFiles([]);
    setResults([]);
    setErrors([]);
    setProgress(0);
    setProcessing(false);
  };

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          font-family: 'Rajdhani', sans-serif;
          background: #0a0a0f;
          color: #e0e0e0;
          overflow-x: hidden;
          touch-action: manipulation;
        }

        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a0e2e 50%, #0a0a0f 100%);
          position: relative;
          padding-bottom: 40px;
        }

        .app-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(138, 43, 226, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 191, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .content {
          position: relative;
          z-index: 1;
          max-width: 600px;
          margin: 0 auto;
          padding: 15px;
        }

        .header {
          text-align: center;
          padding: 30px 15px;
          margin-bottom: 20px;
        }

        .logo {
          font-family: 'Orbitron', sans-serif;
          font-size: 2.2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #8a2be2 0%, #00bfff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 2px;
          margin-bottom: 8px;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { filter: drop-shadow(0 0 15px rgba(138, 43, 226, 0.5)); }
          to { filter: drop-shadow(0 0 30px rgba(0, 191, 255, 0.8)); }
        }

        .tagline {
          font-size: 0.9rem;
          color: #a0a0a0;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .workspace {
          background: rgba(20, 20, 30, 0.6);
          border: 1px solid rgba(138, 43, 226, 0.3);
          border-radius: 20px;
          padding: 20px 15px;
          backdrop-filter: blur(10px);
        }

        .upload-section {
          margin-bottom: 25px;
        }

        .section-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          color: #00bfff;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .upload-box {
          border: 2px dashed rgba(138, 43, 226, 0.5);
          border-radius: 16px;
          padding: 30px 15px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(138, 43, 226, 0.05);
          position: relative;
          margin-bottom: 15px;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .upload-box:active {
          transform: scale(0.98);
        }

        .upload-box input {
          display: none;
        }

        .upload-icon {
          width: 50px;
          height: 50px;
          margin-bottom: 12px;
          color: #8a2be2;
        }

        .upload-text {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 6px;
          color: #e0e0e0;
        }

        .upload-subtext {
          font-size: 0.85rem;
          color: #888;
        }

        .preview-image {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 12px;
          margin-top: 12px;
        }

        .target-files-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 15px;
        }

        .target-file-item {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 1;
          border: 2px solid rgba(138, 43, 226, 0.3);
        }

        .target-file-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(255, 0, 0, 0.9);
          border: none;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-btn:active {
          transform: scale(0.9);
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 25px;
        }

        .btn {
          padding: 14px 30px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'Rajdhani', sans-serif;
          width: 100%;
        }

        .btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .btn-primary {
          background: linear-gradient(135deg, #8a2be2, #00bfff);
          color: white;
          box-shadow: 0 4px 15px rgba(138, 43, 226, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          border: 1px solid rgba(138, 43, 226, 0.5);
        }

        .progress-section {
          margin: 25px 0;
          text-align: center;
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          margin: 15px 0;
          border: 1px solid rgba(138, 43, 226, 0.3);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8a2be2, #00bfff);
          transition: width 0.3s ease;
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.6);
        }

        .progress-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #00bfff;
          margin-top: 8px;
        }

        .results-section {
          margin-top: 30px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 20px;
        }

        .result-item {
          background: rgba(20, 20, 30, 0.8);
          border: 1px solid rgba(138, 43, 226, 0.4);
          border-radius: 12px;
          overflow: hidden;
        }

        .result-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .result-actions {
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .result-name {
          font-size: 0.8rem;
          color: #a0a0a0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .download-icon {
          cursor: pointer;
          color: #00bfff;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .download-icon:active {
          transform: scale(0.9);
        }

        .error-box, .success-box {
          border-radius: 12px;
          padding: 12px 15px;
          margin: 15px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
        }

        .error-box {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.5);
          color: #ff6b6b;
        }

        .success-box {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid rgba(0, 255, 0, 0.5);
          color: #51cf66;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .logo {
            font-size: 1.8rem;
          }
          
          .target-files-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="content">
        <header className="header">
          <h1 className="logo">FACESWAP LITE</h1>
          <p className="tagline">Neural Face Synthesis</p>
        </header>

        <div className="workspace">
          {errors.length > 0 && (
            <div className="error-box">
              <AlertCircle size={20} />
              <div>{errors[0]}</div>
            </div>
          )}

          <div className="upload-section">
            <h2 className="section-title">1. Upload Source Face</h2>
            <div className="upload-box" onClick={() => sourceFaceRef.current?.click()}>
              <input
                ref={sourceFaceRef}
                type="file"
                accept="image/*"
                onChange={handleSourceFaceUpload}
              />
              <Upload className="upload-icon" />
              <div className="upload-text">Upload Face</div>
              <div className="upload-subtext">JPG, PNG • Max 10MB</div>
              {sourceFace && <img src={sourceFace} alt="Source" className="preview-image" />}
            </div>
          </div>

          <div className="upload-section">
            <h2 className="section-title">2. Upload Target Images (Max 20)</h2>
            <div className="upload-box" onClick={() => targetFilesRef.current?.click()}>
              <input
                ref={targetFilesRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleTargetFilesUpload}
              />
              <Upload className="upload-icon" />
              <div className="upload-text">Upload Images</div>
              <div className="upload-subtext">Multiple files • JPG, PNG</div>
            </div>

            {targetFiles.length > 0 && (
              <div className="target-files-grid">
                {targetFiles.map((file, index) => (
                  <div key={index} className="target-file-item">
                    <img src={file.preview} alt={file.name} />
                    <button className="remove-btn" onClick={() => removeTargetFile(index)}>
                      <X size={14} color="white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={processPhotos}
              disabled={processing || !sourceFaceFile || targetFiles.length === 0}
            >
              {processing ? (
                <>
                  <Loader className="loading-spinner" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Start Face Swap
                </>
              )}
            </button>
            <button className="btn btn-secondary" onClick={reset}>
              Reset All
            </button>
          </div>

          {processing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-text">{Math.round(progress)}% Complete</div>
            </div>
          )}

          {results.length > 0 && (
            <div className="results-section">
              <div className="success-box">
                <CheckCircle size={20} />
                <div>Processing complete! {results.filter(r => r.status === 'success').length} images ready</div>
              </div>
              <div className="action-buttons">
                <button className="btn btn-primary" onClick={downloadAllResults}>
                  <Download size={20} />
                  Download All
                </button>
              </div>
              <div className="results-grid">
                {results.map((result, index) => (
                  result.status === 'success' && (
                    <div key={index} className="result-item">
                      <img src={result.url} alt={`Result ${index + 1}`} />
                      <div className="result-actions">
                        <span className="result-name">{result.original}</span>
                        <Download
                          size={20}
                          className="download-icon"
                          onClick={() => downloadResult(result.url, `swapped_${result.original}`)}
                        />
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceSwapLite;

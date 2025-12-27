# 🎭 FaceSwap Lite - Mobile Edition

A mobile-first face-swapping web application optimized for Android browsers. Deploy to Render cloud and access from anywhere!

## ✨ Features

- 📸 **Batch Photo Processing** - Swap faces in up to 20 images at once
- 📱 **Mobile Optimized** - Touch-friendly interface designed for phones
- 🎨 **Dark Cyberpunk UI** - Beautiful purple/cyan gradient design
- ⚡ **Fast Processing** - Results in 30-60 seconds
- 🔒 **Privacy First** - No login required, files auto-delete after 2 hours
- 🆓 **100% Free** - Deploy to Render's free tier

## 🚀 Quick Deploy

### 1. Upload to GitHub
- Upload all files to a new public repository
- Make sure `src/` folder contains `main.jsx` and `FaceSwapLite.jsx`

### 2. Deploy to Render
1. Sign up at https://render.com
2. Create new Web Service from GitHub repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables:
   - `NODE_ENV = production`
   - `PORT = 10000`
6. Deploy and wait 5-10 minutes

### 3. Open on Mobile
- Visit your Render URL
- Add to home screen for app-like experience
- Start swapping faces!

## 📖 Full Documentation

See **DEPLOYMENT_GUIDE.md** for complete step-by-step instructions.

## 🎯 Usage

1. **Upload Source Face** - The face you want to use
2. **Upload Target Images** - Photos where faces will be replaced (1-20)
3. **Start Face Swap** - Process in 30-60 seconds
4. **Download Results** - Save individual or all images

## 💡 Tips

- Use clear, front-facing photos
- Good lighting = better results
- Keep images under 10MB each
- First load after sleep takes 30-60 seconds

## 🛠️ Tech Stack

- React 18 + Vite
- Node.js + Express
- Sharp (image processing)
- Lucide Icons
- Deployed on Render

## 📱 Mobile Features

- Touch-optimized buttons
- Responsive grid layout
- Mobile file picker support
- Pinch-to-zoom disabled for better UX
- Add to home screen support

## 🐛 Troubleshooting

**"Cannot GET /"**
- Clear build cache and redeploy
- Verify build command includes `npm run build`

**Slow performance**
- Normal on free tier
- App sleeps after 15 min inactivity
- Upgrade to paid plan for faster speeds

**Upload failed**
- Check file size (max 10MB per image)
- Verify internet connection
- Try smaller images

## 📄 License

MIT License - Free to use and modify

## 🙏 Acknowledgments

Built with React, Express, Sharp, and Render cloud services.

---

**Transform Reality with Neural Face Synthesis** 🎭✨

Made with 💜 for mobile users

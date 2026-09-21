# 🚀 SIMPLE DEPLOYMENT GUIDE

## BACKEND (Render.com)

1. **Create Web Service**
   - Repository: `amrityadav11/QR-PHOTO-FINDER`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://QRPHOTOFINDER:QRPHOTOFINDER@cluster0.eocvxb8.mongodb.net/qrphotofinder?retryWrites=true&w=majority
   JWT_SECRET=9be1a9f167c221983b371ef33d006056cb1e2b0d17d2310e6a24d66be5eadc6dc08fa667fbe0b3e0cf3ccf4e54c21b7bcb6b0ae56f547246fceed03e4a774677
   CLOUDINARY_CLOUD_NAME=dxinpjsrd
   CLOUDINARY_API_KEY=431351477165717
   CLOUDINARY_API_SECRET=qNyU9wjK-_0IDk4bFiwtJKCh_WE
   ```

## FRONTEND (Vercel.com)

1. **Import Project**
   - Repository: `amrityadav11/QR-PHOTO-FINDER`
   - Framework: React
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

2. **No Environment Variables Needed** (using .env.production file)

## TEST URLs

- **Backend Health:** https://qr-photo-finder.onrender.com/api/health
- **Frontend:** https://qr-photo-finder.vercel.app
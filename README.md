# 📸 SnapFind - QR Photo Finder SaaS

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/qr-photo-finder)

A complete SaaS platform for event photographers to organize and share photos using QR codes and AI-powered face matching.

## 🌟 Features

- **QR Code Generation**: Create unique QR codes for each event
- **AI Face Recognition**: Match guest selfies to event photos using AWS Rekognition, Face++, or local matching
- **Photo Management**: Upload, organize, and manage event photo galleries
- **Guest Experience**: Scan QR → Upload Selfie → Get Matched Photos
- **Analytics Dashboard**: Track searches, downloads, and user engagement
- **Multi-tenant SaaS**: Support for multiple photographers with individual dashboards
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## 🚀 Live Demo

- **Frontend**: [https://your-app.vercel.app](https://your-app.vercel.app)
- **API**: [https://your-app.vercel.app/api](https://your-app.vercel.app/api)

## 🛠️ Tech Stack

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API calls
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** authentication
- **Cloudinary** for image storage
- **Multer** for file uploads
- **AWS Rekognition** / **Face++** / **Local** face matching

### Infrastructure
- **Vercel** for hosting (frontend + serverless backend)
- **MongoDB Atlas** for database
- **Cloudinary** for image CDN

## 📦 Quick Deploy to Vercel

### 1. One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/qr-photo-finder)

### 2. Manual Deploy

1. **Fork/Clone this repository**
2. **Push to your GitHub**
3. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

4. **Set Environment Variables** in Vercel dashboard:
   ```bash
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-64-chars-long
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Face Recognition (choose one)
   FACE_RECOGNITION_PROVIDER=aws  # or 'facepp' or 'local'
   
   # If using AWS Rekognition
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_REGION=us-east-1
   
   # If using Face++
   FACEPP_API_KEY=your-facepp-key
   FACEPP_API_SECRET=your-facepp-secret
   ```

5. **Deploy** - Vercel handles the rest automatically!

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- AWS Rekognition or Face++ account (optional)

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/qr-photo-finder.git
cd qr-photo-finder

# Install dependencies
npm run install:all

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Start development servers
npm run dev:backend    # Backend on port 5000
npm run dev:frontend   # Frontend on port 3000
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get user events
- `POST /api/events` - Create new event
- `GET /api/events/:slug` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Photos
- `POST /api/events/:id/photos/upload` - Upload photos
- `GET /api/events/:id/photos` - Get event photos
- `DELETE /api/photos/:id` - Delete photo

### Public (Guest) Routes
- `GET /api/public/events/:slug` - Get public event info
- `POST /api/public/events/:slug/search` - Search photos by selfie

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/events/:id` - Event analytics

## 🔐 Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | `your-secret-key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-secret` |

### Face Recognition (Choose One)
| Variable | Description | Required For |
|----------|-------------|--------------|
| `FACE_RECOGNITION_PROVIDER` | Provider: `aws`, `facepp`, or `local` | All |
| `AWS_ACCESS_KEY_ID` | AWS access key | AWS Rekognition |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | AWS Rekognition |
| `AWS_REGION` | AWS region | AWS Rekognition |
| `FACEPP_API_KEY` | Face++ API key | Face++ |
| `FACEPP_API_SECRET` | Face++ API secret | Face++ |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_URL` | Frontend URL | `http://localhost:3000` |
| `MAX_FILE_SIZE_MB` | Upload limit (MB) | `20` |
| `FACE_SIMILARITY_THRESHOLD` | Face match threshold | `0.80` |

## 📱 Usage

### For Event Photographers

1. **Register/Login** to your photographer dashboard
2. **Create Events** with names, descriptions, and settings
3. **Generate QR Codes** for each event (PNG/SVG download)
4. **Upload Photos** in bulk with drag-and-drop
5. **Share QR Codes** with event attendees
6. **Monitor Analytics** - track searches and downloads

### For Event Guests

1. **Scan QR Code** or visit event link
2. **Review Privacy Notice** and give consent
3. **Take/Upload Selfie** for face matching
4. **Get Matched Photos** in real-time
5. **Download Photos** individually or in bulk
6. **Share Results** with friends and family

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │────│  Express API    │────│   MongoDB Atlas │
│   (Vercel)      │    │  (Vercel)       │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                       ┌───────┴───────┐
                       │               │
              ┌─────────────────┐ ┌─────────────────┐
              │   Cloudinary    │ │ Face Recognition│
              │   (Images)      │ │ (AWS/Face++/Local)│
              └─────────────────┘ └─────────────────┘
```

## 🔒 Security Features

- JWT-based authentication
- CORS protection
- Rate limiting (general + strict)
- Input validation with express-validator
- File type validation
- Secure headers with Helmet
- Environment-based configuration
- MongoDB injection protection

## 🚀 Performance Features

- Cloudinary image optimization and CDN
- Efficient face embedding storage
- Indexed database queries
- Lazy loading and pagination
- Background photo processing
- Serverless scaling with Vercel

## 📊 Analytics & Monitoring

- User registration and login tracking
- Event creation and photo upload metrics
- Guest search behavior and conversion rates
- Photo download statistics
- Real-time dashboard with charts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an [Issue](https://github.com/your-username/qr-photo-finder/issues) for bug reports
- Start a [Discussion](https://github.com/your-username/qr-photo-finder/discussions) for questions
- Email: support@yourapp.com

## 🎯 Roadmap

- [ ] Email notifications for new photos
- [ ] WhatsApp integration for photo sharing  
- [ ] Advanced face recognition with emotion detection
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Stripe/Razorpay payment integration
- [ ] Advanced analytics and reporting
- [ ] Bulk photo watermarking
- [ ] Social media integration

---

Built with ❤️ by [Your Name](https://github.com/your-username) | [Live Demo](https://your-app.vercel.app) | [API Docs](https://your-app.vercel.app/api)
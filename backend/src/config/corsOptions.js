const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://qr-photo-finder.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      process.env.NODE_ENV === 'development';

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions;

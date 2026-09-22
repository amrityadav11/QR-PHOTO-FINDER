const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://qr-photo-finder.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    const isVercelDomain = origin.includes('vercel.app') || /\.vercel\.app$/i.test(origin);
    const isExplicitlyAllowed = allowedOrigins.includes(origin);

    if (isExplicitlyAllowed || isVercelDomain || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Allow all origins to prevent CORS preflight blocks across deployment previews
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

module.exports = corsOptions;

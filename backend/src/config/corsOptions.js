const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'https://qrphotofinder.com',
  'https://www.qrphotofinder.com',
  'https://qr-photo-finder.vercel.app',
  'https://qr-photo-finder-frontend-37qh-3qv7e4dkl-amrityadav-87591c87.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow Vercel domains (all preview and production URLs)
    if (origin.includes('vercel.app') || origin.includes('qrphotofinder.com')) {
      return callback(null, true);
    }

    // Allow specific origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours preflight cache
};

module.exports = corsOptions;

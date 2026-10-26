// src/app.js
// Express application setup (middleware, routes, error handling).
// Exported for testing and used by index.js to start the server.

require('dotenv/config');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const checklistRoutes = require('./routes/checklists');
const generateRoutes = require('./routes/generate');

const app = express();

// Trust reverse proxy (Render load balancer / ingress)
app.set('trust proxy', 1);

// ─── Security middleware ───────────────────────────────────────────────────
app.use(helmet());

// CORS: allow frontend origins
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.error('Fatal: FRONTEND_URL must be set to a comma-separated list of exact origins in production');
  process.exit(1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  })
);

// Rate limiting: 100 requests per 15 minutes per IP
const isTest = process.env.NODE_ENV === 'test';

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many requests, please try again later.' },
  })
);

// ─── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many attempts, please try again later.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/generate', generateRoutes);

// Health check endpoint — Render uses this to verify the service is running
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler ────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

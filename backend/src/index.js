// src/index.js
// Entry point for the Express server.
// Starts the server, registers all middleware and routes.

require('dotenv/config'); // Load .env file in development
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const checklistRoutes = require('./routes/checklists');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust reverse proxy (Render load balancer / ingress)
app.set('trust proxy', 1);

// ─── Security middleware ───────────────────────────────────────────────────
// helmet sets safe HTTP headers
app.use(helmet());

// CORS: allow only the frontend origin
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173']; // Vite dev server default

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Rate limiting: 100 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many requests, please try again later.' },
  })
);

// ─── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/checklists', checklistRoutes);

// Health check endpoint — Render uses this to verify the service is running
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler ────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

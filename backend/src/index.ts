// src/index.ts
// Entry point for the Express server.
// Starts the server, registers all middleware and routes.

import 'dotenv/config'; // Load .env file in development
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import checklistRoutes from './routes/checklists';

const app = express();
const PORT = process.env.PORT || 4000;

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
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

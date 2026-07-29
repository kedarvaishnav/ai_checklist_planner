// src/routes/auth.ts
// POST /api/auth/register  — create a new account
// POST /api/auth/login     — sign in and receive a JWT
// GET  /api/auth/me        — get current user info (requires auth)

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();

// --- Validation schemas ---
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Helper: sign a JWT for a given user id
function signToken(userId: number): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;

  // Check if email is already taken
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }

  // Hash password (salt rounds = 12)
  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
    [email, hash]
  );

  const user = result.rows[0];
  const token = signToken(user.id);

  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid email or password' });
    return;
  }

  const { email, password } = parsed.data;

  const result = await pool.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    // Avoid leaking whether the email exists
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

// GET /api/auth/me  (protected)
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.userId]);
  if (!result.rows[0]) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: result.rows[0] });
});

export default router;

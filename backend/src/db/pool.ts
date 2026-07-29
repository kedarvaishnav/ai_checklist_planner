// src/db/pool.ts
// Single shared PostgreSQL connection pool used across all routes.

import { Pool } from 'pg';

// Render provides DATABASE_URL automatically when you attach a Postgres service.
// For local dev, put the URL in your .env file.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's managed Postgres requires SSL in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;

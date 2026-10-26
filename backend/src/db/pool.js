// src/db/pool.js
// Single shared PostgreSQL connection pool used across all routes.

const { Pool } = require('pg');

// Render provides DATABASE_URL automatically when you attach a Postgres service.
// For local dev, put the URL in your .env file.
const sslConfig =
  process.env.NODE_ENV === 'production'
    ? {
        rejectUnauthorized:
          process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
      }
    : false;

const connectionString =
  process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
});

module.exports = pool;

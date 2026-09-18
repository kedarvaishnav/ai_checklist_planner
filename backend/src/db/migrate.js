// src/db/migrate.js
// Run this script to create/update database tables.

require('dotenv/config');
const pool = require('./pool');

async function migrate(shouldClosePool = false) {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');

    // Users table — stores login credentials
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        email       TEXT NOT NULL UNIQUE,
        password    TEXT NOT NULL,         -- bcrypt hash
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Checklists table — one row per saved checklist
    await client.query(`
      CREATE TABLE IF NOT EXISTS checklists (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL DEFAULT 'My Checklist',
        raw_input   TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Categories table — sections inside a checklist
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id            SERIAL PRIMARY KEY,
        checklist_id  INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
        name          TEXT NOT NULL,
        position      INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Tasks table — individual items inside a category
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           SERIAL PRIMARY KEY,
        category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        title        TEXT NOT NULL,
        completed    BOOLEAN NOT NULL DEFAULT FALSE,
        position     INTEGER NOT NULL DEFAULT 0
      );
    `);

    console.log('✅ Migrations complete');
  } finally {
    client.release();
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate(true).catch((err) => {
    // If running in Render build environment, internal database hostname (dpg-*) is only resolvable at runtime
    if (err && (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED')) {
      console.warn('⚠️ Database not reachable during build (internal Render host). Migrations will automatically run at server startup.');
      process.exit(0);
    }
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

// src/index.js
// Entry point for the Express server.
// Starts the server, runs database migrations.

require('dotenv/config');

if (!process.env.JWT_SECRET) {
  console.error('Fatal: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const app = require('./app');
const { migrate } = require('./db/migrate');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await migrate(false);
  } catch (err) {
    console.error('Database migration at startup error:', err);
  }

  app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
  });
}

start();

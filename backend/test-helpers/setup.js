// test-helpers/setup.js
// Common test setup: database validation, migrations, and table truncating.

require('dotenv/config');

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is not set. Refusing to run tests.');
}

if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL cannot equal DATABASE_URL. Refusing to run tests on development database.');
}

process.env.NODE_ENV = 'test';

const pool = require('../src/db/pool');
const { migrate } = require('../src/db/migrate');
const app = require('../src/app');

let migrated = false;

async function setupTestDb() {
  if (!migrated) {
    await migrate(false);
    migrated = true;
  }
  await pool.query('TRUNCATE TABLE users, checklists, categories, tasks RESTART IDENTITY CASCADE;');
}

module.exports = {
  app,
  pool,
  setupTestDb,
};

// test/generate.test.js
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, setupTestDb } = require('../test-helpers/setup');

describe('Generate API Tests', { concurrency: false }, () => {
  let authToken;

  beforeEach(async () => {
    await setupTestDb();
    authToken = jwt.sign(
      { userId: 1, email: 'tester@example.com' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
  });

  test('returns 400 when input text is too short (less than 20 characters)', async () => {
    const res = await request(app)
      .post('/api/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'too short' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /at least 20 characters/i);
  });

  test('returns 503 when GEMINI_MODEL is unset', async () => {
    const savedModel = process.env.GEMINI_MODEL;
    try {
      delete process.env.GEMINI_MODEL;
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Here is a sufficiently long text for generating a checklist with tasks.' });

      assert.equal(res.status, 503);
      assert.equal(res.body.error, 'AI generation is not configured');
    } finally {
      process.env.GEMINI_MODEL = savedModel;
    }
  });

  test('returns 503 when GEMINI_API_KEY is unset', async () => {
    const savedKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Here is a sufficiently long text for generating a checklist with tasks.' });

      assert.equal(res.status, 503);
      assert.equal(res.body.error, 'AI generation is not configured');
    } finally {
      process.env.GEMINI_API_KEY = savedKey;
    }
  });
});

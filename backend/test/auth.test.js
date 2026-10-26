// test/auth.test.js
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setupTestDb } = require('../test-helpers/setup');

describe('Authentication and Authorization Tests', { concurrency: false }, () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  describe('POST /api/auth/register', { concurrency: false }, () => {
    test('successfully registers a new user with 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'alice@example.com',
          password: 'Password123!',
        });

      assert.equal(res.status, 201);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, 'alice@example.com');
    });

    test('returns 409 when registering duplicate email in different case', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'DupUser@Example.COM',
          password: 'Password123!',
        });
      assert.equal(res1.status, 201);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dupuser@example.com',
          password: 'DifferentPassword123!',
        });

      assert.equal(res2.status, 409);
      assert.match(res2.body.error, /already exists/i);
    });

    test('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'shortpass@example.com',
          password: 'short',
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.error);
    });
  });

  describe('POST /api/auth/login', { concurrency: false }, () => {
    test('successfully logs in with 200 and returns token', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'bob@example.com',
          password: 'CorrectPassword123!',
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'CorrectPassword123!',
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, 'bob@example.com');
    });

    test('returns 401 when given a wrong password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'bob2@example.com',
          password: 'CorrectPassword123!',
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob2@example.com',
          password: 'WrongPassword999!',
        });

      assert.equal(res.status, 401);
      assert.match(res.body.error, /invalid email or password/i);
    });
  });

  describe('Auth middleware verification', { concurrency: false }, () => {
    test('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/checklists');
      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });

    test('returns 401 when Authorization token is invalid or malformed', async () => {
      const res = await request(app)
        .get('/api/checklists')
        .set('Authorization', 'Bearer invalid-token-string');

      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });
  });
});

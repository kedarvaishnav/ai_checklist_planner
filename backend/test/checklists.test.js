// test/checklists.test.js
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setupTestDb } = require('../test-helpers/setup');

describe('Checklists API Tests', { concurrency: false }, () => {
  let tokenA;
  let tokenB;

  beforeEach(async () => {
    await setupTestDb();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userA@example.com', password: 'Password123!' });
    tokenA = resA.body.token;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userB@example.com', password: 'Password123!' });
    tokenB = resB.body.token;
  });

  test('creates a checklist with categories and tasks', async () => {
    const res = await request(app)
      .post('/api/checklists')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Launch Plan',
        rawInput: 'Some raw plan text',
        categories: [
          {
            category: 'Dev',
            tasks: [{ title: 'Write tests', completed: false }],
          },
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Launch Plan');
    assert.equal(res.body.categories.length, 1);
    assert.equal(res.body.categories[0].category, 'Dev');
    assert.equal(res.body.categories[0].tasks.length, 1);
    assert.equal(res.body.categories[0].tasks[0].title, 'Write tests');
  });

  test('enforces checklist ownership isolation (user B gets 404 on user A checklist)', async () => {
    // User A creates a checklist
    const createRes = await request(app)
      .post('/api/checklists')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'User A Secret Checklist',
        rawInput: 'Top secret',
        categories: [
          {
            category: 'Secrets',
            tasks: [{ title: 'Classified task', completed: false }],
          },
        ],
      });

    assert.equal(createRes.status, 201);
    const checklistId = createRes.body.id;

    // User A can access it
    const accessResA = await request(app)
      .get(`/api/checklists/${checklistId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(accessResA.status, 200);

    // User B receives 404 Not Found
    const accessResB = await request(app)
      .get(`/api/checklists/${checklistId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert.equal(accessResB.status, 404);
    assert.equal(accessResB.body.error, 'Checklist not found');
  });

  test('setting a task completed twice is idempotent', async () => {
    // Create checklist with a task
    const createRes = await request(app)
      .post('/api/checklists')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Task Completion Test',
        rawInput: 'Tasks',
        categories: [
          {
            category: 'Work',
            tasks: [{ title: 'Fix bug', completed: false }],
          },
        ],
      });

    const checklistId = createRes.body.id;
    const taskId = createRes.body.categories[0].tasks[0].id;

    // Set task completed: true (1st time)
    const patch1 = await request(app)
      .patch(`/api/checklists/${checklistId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completed: true });

    assert.equal(patch1.status, 200);
    assert.equal(patch1.body.completed, true);

    // Set task completed: true (2nd time - idempotent)
    const patch2 = await request(app)
      .patch(`/api/checklists/${checklistId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completed: true });

    assert.equal(patch2.status, 200);
    assert.equal(patch2.body.completed, true);
  });
});

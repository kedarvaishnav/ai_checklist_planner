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

  test('creates a blank checklist with optional rawInput and empty categories', async () => {
    const res = await request(app)
      .post('/api/checklists')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Blank Checklist',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Blank Checklist');
    assert.equal(res.body.rawInput, '');
    assert.deepEqual(res.body.categories, []);
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

  describe('Categories Management (POST, PATCH, DELETE)', () => {
    let checklistId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/checklists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Category Test Checklist' });
      checklistId = res.body.id;
    });

    test('POST /api/checklists/:id/categories creates category with atomic position', async () => {
      const res1 = await request(app)
        .post(`/api/checklists/${checklistId}/categories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Backend' });

      assert.equal(res1.status, 201);
      assert.equal(res1.body.name, 'Backend');
      assert.equal(res1.body.position, 0);

      const res2 = await request(app)
        .post(`/api/checklists/${checklistId}/categories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Frontend' });

      assert.equal(res2.status, 201);
      assert.equal(res2.body.name, 'Frontend');
      assert.equal(res2.body.position, 1);
    });

    test('POST /api/checklists/:id/categories returns 400 on invalid input and 404 for User B', async () => {
      // 400 on empty name
      const res400 = await request(app)
        .post(`/api/checklists/${checklistId}/categories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: '   ' });
      assert.equal(res400.status, 400);

      // 404 for user B
      const res404 = await request(app)
        .post(`/api/checklists/${checklistId}/categories`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Category' });
      assert.equal(res404.status, 404);
    });

    test('PATCH /api/checklists/:id/categories/:categoryId updates category name', async () => {
      const catRes = await request(app)
        .post(`/api/checklists/${checklistId}/categories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Initial Name' });
      const categoryId = catRes.body.id;

      // Successful rename
      const res = await request(app)
        .patch(`/api/checklists/${checklistId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Updated Name' });

      assert.equal(res.status, 200);
      assert.equal(res.body.name, 'Updated Name');

      // 400 on empty name
      const res400 = await request(app)
        .patch(`/api/checklists/${checklistId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: '' });
      assert.equal(res400.status, 400);

      // 404 for User B
      const res404 = await request(app)
        .patch(`/api/checklists/${checklistId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'User B Attempt' });
      assert.equal(res404.status, 404);
    });

    test('DELETE /api/checklists/:id/categories/:categoryId deletes category and cascaded tasks', async () => {
      const catRes = await request(app)
        .post(`/api/checklists/${checklistId}/categories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'To Be Deleted' });
      const categoryId = catRes.body.id;

      // Add a task into this category
      await request(app)
        .post(`/api/checklists/${checklistId}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId, title: 'Task inside category' });

      // 404 for User B trying to delete User A's category
      const res404 = await request(app)
        .delete(`/api/checklists/${checklistId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(res404.status, 404);

      // Successful delete by User A
      const deleteRes = await request(app)
        .delete(`/api/checklists/${checklistId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(deleteRes.status, 200);
      assert.equal(deleteRes.body.message, 'Category deleted');

      // Verify category is gone from checklist
      const full = await request(app)
        .get(`/api/checklists/${checklistId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(full.body.categories.length, 0);
    });
  });

  describe('Tasks Management (POST, PATCH, DELETE)', () => {
    let checklistId;
    let categoryId;

    beforeEach(async () => {
      const clRes = await request(app)
        .post('/api/checklists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Task Test Checklist' });
      checklistId = clRes.body.id;

      const catRes = await request(app)
        .post(`/api/checklists/${checklistId}/categories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Tasks Category' });
      categoryId = catRes.body.id;
    });

    test('POST /api/checklists/:id/tasks adds task with atomic position', async () => {
      const res1 = await request(app)
        .post(`/api/checklists/${checklistId}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId, title: 'First Task' });

      assert.equal(res1.status, 201);
      assert.equal(res1.body.title, 'First Task');
      assert.equal(res1.body.position, 0);
      assert.equal(res1.body.completed, false);

      const res2 = await request(app)
        .post(`/api/checklists/${checklistId}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId, title: 'Second Task' });

      assert.equal(res2.status, 201);
      assert.equal(res2.body.title, 'Second Task');
      assert.equal(res2.body.position, 1);
    });

    test('POST /api/checklists/:id/tasks returns 400 on invalid input and 404 for User B', async () => {
      // 400 on empty title
      const res400 = await request(app)
        .post(`/api/checklists/${checklistId}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId, title: '' });
      assert.equal(res400.status, 400);

      // 404 for User B
      const res404 = await request(app)
        .post(`/api/checklists/${checklistId}/tasks`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ categoryId, title: 'User B Task' });
      assert.equal(res404.status, 404);
    });

    test('PATCH /api/checklists/:id/tasks/:taskId updates title and/or completed', async () => {
      const taskRes = await request(app)
        .post(`/api/checklists/${checklistId}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId, title: 'Original Task Title' });
      const taskId = taskRes.body.id;

      // Update title only
      const resTitle = await request(app)
        .patch(`/api/checklists/${checklistId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'New Task Title' });
      assert.equal(resTitle.status, 200);
      assert.equal(resTitle.body.title, 'New Task Title');
      assert.equal(resTitle.body.completed, false);

      // Update completed only
      const resComp = await request(app)
        .patch(`/api/checklists/${checklistId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ completed: true });
      assert.equal(resComp.status, 200);
      assert.equal(resComp.body.completed, true);
      assert.equal(resComp.body.title, 'New Task Title');

      // Update both
      const resBoth = await request(app)
        .patch(`/api/checklists/${checklistId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Finished Task', completed: false });
      assert.equal(resBoth.status, 200);
      assert.equal(resBoth.body.title, 'Finished Task');
      assert.equal(resBoth.body.completed, false);

      // 400 on empty update body
      const res400 = await request(app)
        .patch(`/api/checklists/${checklistId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});
      assert.equal(res400.status, 400);

      // 404 for User B
      const res404 = await request(app)
        .patch(`/api/checklists/${checklistId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title' });
      assert.equal(res404.status, 404);
    });

    test('DELETE /api/checklists/:id/tasks/:taskId deletes task', async () => {
      const taskRes = await request(app)
        .post(`/api/checklists/${checklistId}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId, title: 'Task To Delete' });
      const taskId = taskRes.body.id;

      // 404 for User B
      const res404 = await request(app)
        .delete(`/api/checklists/${checklistId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(res404.status, 404);

      // Delete by User A
      const deleteRes = await request(app)
        .delete(`/api/checklists/${checklistId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(deleteRes.status, 200);
      assert.equal(deleteRes.body.message, 'Task deleted');

      // Verify task is gone
      const full = await request(app)
        .get(`/api/checklists/${checklistId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(full.body.categories[0].tasks.length, 0);
    });
  });
});

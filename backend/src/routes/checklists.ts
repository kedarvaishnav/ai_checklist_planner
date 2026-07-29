// src/routes/checklists.ts
// All routes here are protected — they require a valid JWT.
//
// GET    /api/checklists           — list all checklists for the logged-in user
// POST   /api/checklists           — create a new checklist (saves parsed categories + tasks)
// GET    /api/checklists/:id       — get a single checklist with all its categories + tasks
// PUT    /api/checklists/:id       — update checklist title
// DELETE /api/checklists/:id       — delete a checklist
//
// PATCH  /api/checklists/:id/tasks/:taskId  — toggle a task's completed status

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All checklist routes require authentication
router.use(requireAuth);

// --- Validation schemas ---
const createChecklistSchema = z.object({
  title: z.string().min(1).max(200).default('My Checklist'),
  rawInput: z.string().min(1, 'rawInput is required'),
  // Pre-parsed categories sent from the frontend parser
  categories: z.array(
    z.object({
      category: z.string(),
      tasks: z.array(
        z.object({
          title: z.string(),
          completed: z.boolean().default(false),
        })
      ),
    })
  ),
});

const updateChecklistSchema = z.object({
  title: z.string().min(1).max(200),
});

// Helper: fetch a checklist and verify it belongs to the requesting user
async function getOwnedChecklist(checklistId: number, userId: number) {
  const result = await pool.query(
    'SELECT * FROM checklists WHERE id = $1 AND user_id = $2',
    [checklistId, userId]
  );
  return result.rows[0] ?? null;
}

// Helper: load full checklist data (categories + tasks)
async function loadChecklistFull(checklistId: number) {
  const checklistResult = await pool.query(
    'SELECT id, title, raw_input, created_at, updated_at FROM checklists WHERE id = $1',
    [checklistId]
  );
  const checklist = checklistResult.rows[0];
  if (!checklist) return null;

  const categoriesResult = await pool.query(
    'SELECT id, name, position FROM categories WHERE checklist_id = $1 ORDER BY position',
    [checklistId]
  );

  const categories = await Promise.all(
    categoriesResult.rows.map(async (cat) => {
      const tasksResult = await pool.query(
        'SELECT id, title, completed, position FROM tasks WHERE category_id = $1 ORDER BY position',
        [cat.id]
      );
      return {
        id: cat.id,
        category: cat.name,
        tasks: tasksResult.rows.map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
        })),
      };
    })
  );

  return {
    id: checklist.id,
    title: checklist.title,
    rawInput: checklist.raw_input,
    createdAt: checklist.created_at,
    updatedAt: checklist.updated_at,
    categories,
  };
}

// GET /api/checklists
router.get('/', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, title, created_at, updated_at
     FROM checklists
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [req.userId]
  );
  res.json({ checklists: result.rows });
});

// POST /api/checklists
router.post('/', async (req: Request, res: Response) => {
  const parsed = createChecklistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { title, rawInput, categories } = parsed.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert checklist row
    const checklistResult = await client.query(
      'INSERT INTO checklists (user_id, title, raw_input) VALUES ($1, $2, $3) RETURNING id',
      [req.userId, title, rawInput]
    );
    const checklistId = checklistResult.rows[0].id;

    // Insert categories and their tasks
    for (let catPos = 0; catPos < categories.length; catPos++) {
      const cat = categories[catPos];
      const catResult = await client.query(
        'INSERT INTO categories (checklist_id, name, position) VALUES ($1, $2, $3) RETURNING id',
        [checklistId, cat.category, catPos]
      );
      const categoryId = catResult.rows[0].id;

      for (let taskPos = 0; taskPos < cat.tasks.length; taskPos++) {
        const task = cat.tasks[taskPos];
        await client.query(
          'INSERT INTO tasks (category_id, title, completed, position) VALUES ($1, $2, $3, $4)',
          [categoryId, task.title, task.completed, taskPos]
        );
      }
    }

    await client.query('COMMIT');

    const full = await loadChecklistFull(checklistId);
    res.status(201).json(full);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/checklists/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const owned = await getOwnedChecklist(id, req.userId!);
  if (!owned) { res.status(404).json({ error: 'Checklist not found' }); return; }

  const full = await loadChecklistFull(id);
  res.json(full);
});

// PUT /api/checklists/:id  — update title
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const owned = await getOwnedChecklist(id, req.userId!);
  if (!owned) { res.status(404).json({ error: 'Checklist not found' }); return; }

  const parsed = updateChecklistSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }

  await pool.query(
    'UPDATE checklists SET title = $1, updated_at = NOW() WHERE id = $2',
    [parsed.data.title, id]
  );
  res.json({ message: 'Updated' });
});

// DELETE /api/checklists/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const owned = await getOwnedChecklist(id, req.userId!);
  if (!owned) { res.status(404).json({ error: 'Checklist not found' }); return; }

  // Cascade deletes categories and tasks automatically (set in migration)
  await pool.query('DELETE FROM checklists WHERE id = $1', [id]);
  res.json({ message: 'Deleted' });
});

// PATCH /api/checklists/:id/tasks/:taskId  — toggle completed
router.patch('/:id/tasks/:taskId', async (req: Request, res: Response) => {
  const checklistId = parseInt(req.params.id, 10);
  const taskId = parseInt(req.params.taskId, 10);

  if (isNaN(checklistId) || isNaN(taskId)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  // Verify ownership by joining through the checklist
  const owned = await getOwnedChecklist(checklistId, req.userId!);
  if (!owned) { res.status(404).json({ error: 'Checklist not found' }); return; }

  // Toggle the task's completed state
  const result = await pool.query(
    `UPDATE tasks
     SET completed = NOT completed
     WHERE id = $1
       AND category_id IN (
         SELECT id FROM categories WHERE checklist_id = $2
       )
     RETURNING id, completed`,
    [taskId, checklistId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  // Update the checklist's updated_at timestamp
  await pool.query('UPDATE checklists SET updated_at = NOW() WHERE id = $1', [checklistId]);

  res.json({ id: result.rows[0].id, completed: result.rows[0].completed });
});

export default router;

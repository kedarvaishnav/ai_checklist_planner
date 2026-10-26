const { z } = require('zod');

const taskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  completed: z.boolean().default(false),
});

const categorySchema = z.object({
  category: z.string().trim().min(1).max(200),
  tasks: z.array(taskSchema).max(100),
});

const createChecklistSchema = z.object({
  title: z.string().trim().min(1).max(200).default('My Checklist'),
  rawInput: z.string().max(20000).default(''),
  categories: z.array(categorySchema).max(50).default([]),
});

const generatedChecklistSchema = z.object({
  categories: z.array(categorySchema).min(1).max(50),
});

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(200, 'Category name cannot exceed 200 characters'),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(200, 'Category name cannot exceed 200 characters'),
});

const createTaskSchema = z.object({
  categoryId: z.coerce.number().int().positive('Category ID must be a positive integer'),
  title: z.string().trim().min(1, 'Task title is required').max(300, 'Task title cannot exceed 300 characters'),
});

const patchTaskSchema = z
  .object({
    completed: z.boolean().optional(),
    title: z.string().trim().min(1, 'Task title is required').max(300, 'Task title cannot exceed 300 characters').optional(),
  })
  .refine(
    (data) => data.completed !== undefined || data.title !== undefined,
    { message: 'At least one field (completed or title) is required' }
  );

module.exports = {
  taskSchema,
  categorySchema,
  createChecklistSchema,
  generatedChecklistSchema,
  createCategorySchema,
  updateCategorySchema,
  createTaskSchema,
  patchTaskSchema,
};

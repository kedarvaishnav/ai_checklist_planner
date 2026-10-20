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
  rawInput: z.string().min(1, 'rawInput is required').max(20000),
  categories: z.array(categorySchema).max(50),
});

const generatedChecklistSchema = z.object({
  categories: z.array(categorySchema).min(1).max(50),
});

module.exports = {
  taskSchema,
  categorySchema,
  createChecklistSchema,
  generatedChecklistSchema,
};

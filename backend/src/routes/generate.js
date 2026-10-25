const { Router } = require('express');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { generateChecklist } = require('../services/generateChecklist');

const router = Router();

// Must be authenticated
router.use(requireAuth);

// User-keyed rate limiting: 10 requests per hour per user
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => String(req.userId),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many generation requests, please try again later.' },
});

router.use(generateLimiter);

const generateBodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(20, 'Text must be at least 20 characters')
    .max(20000, 'Text must be at most 20000 characters'),
});

// POST /api/generate
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = generateBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    try {
      const result = await generateChecklist(parsed.data.text);
      res.json(result);
    } catch (err) {
      if (err.status) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }
  })
);

module.exports = router;

// src/middleware/auth.js
// Protects routes by verifying the JWT sent in the Authorization header.
//
// Usage: router.get('/protected', requireAuth, handler)
//
// The middleware attaches `req.userId` (number) so route handlers
// know which user is making the request.

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET env variable is not set');

    const payload = jwt.verify(token, secret);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };

const express = require('express');
const authMiddleware = express.Router();

authMiddleware.use((req, res, next) => {
  const { token } = req.headers;

  if (!token || invalidatedTokens.has(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
});

module.exports = authMiddleware;
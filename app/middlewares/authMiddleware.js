const express = require('express');
const authMiddleware = express.Router();

// Define invalidatedTokens at the global scope
const invalidatedTokens = new Set();
//This allows you to use invalidated tokens outside of this 
exports.invalidatedTokens = invalidatedTokens;

authMiddleware.use((req, res, next) => {
  let { authorization } = req.headers;
  
  if (!authorization || invalidatedTokens.has(authorization)) {
    console.log("Unauthorized access attempt: ", authorization ? "Token is invalidated" : "Token is missing");
    const err = new Error('Unauthorized');
    err.status = 401;
    return next(err);
  }
  
  next();
});

exports.invalidateToken = (token) => {
	if (!token) {
		return res.status(400).json({ message: 'Token is missing in request' });
	}

	// Add the token to the invalidatedTokens blacklist
	invalidatedTokens.add(token);
}

module.exports = authMiddleware;
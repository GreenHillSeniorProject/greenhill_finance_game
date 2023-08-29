const express = require('express');
const router = express.Router();

// Define invalidatedTokens at the global scope
const invalidatedTokens = new Set();
//This allows you to use invalidated tokens outside of this 
exports.invalidatedTokens = invalidatedTokens;

let authentication_main = (req, res, next) => {
	const authHeader = req.headers.authorization;
	  
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Invalid authorization header' });
	}
	
	const token = authHeader.split(' ')[1]; // Extract the token part
	
	if (!token || invalidatedTokens.has(token)) {
		console.log("Unauthorized access attempt: ", token ? "Token is invalidated" : "Token is missing");
		const err = new Error('Unauthorized');
		err.status = 401;
		return next(err);
	}
	
	next();
};
exports.authentication_main = authentication_main;

let invalidateToken = async (token) => {
	if (!token) {
		return res.status(400).json({ message: 'Token is missing in request' });
	}
	// Add the token to the invalidatedTokens blacklist
	invalidatedTokens.add(token);
}
exports.invalidateToken = invalidateToken;
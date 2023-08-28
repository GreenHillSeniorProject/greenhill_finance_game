const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

let logout_main = (req, res, next) => {
	const { token } = req.body;

	if (!token) {
		console.log("No token provided in request");
        const err = new Error('Unauthorized');
        err.status = 404;
        next(err);
	}

	// Add the token to the invalidatedTokens blacklist
	authMiddleware.invalidateToken(token);

	// TODO: You could also persist the blacklist in a file or database for better durability

	res.status(200).json({ message: 'Logout successful' });
};

router.post('/logout', logout_main);

module.exports = router;
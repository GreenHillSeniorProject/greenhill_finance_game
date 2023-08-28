const express = require('express');
const router = express.Router();
let db = require('../controllers/dbController');
let jwtCTLR = require('../controllers/tokenController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

let homepage_main = async (req, res) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Invalid authorization header' });
	}

	const token = authHeader.split(' ')[1]; // Extract the token part
	
	try {
		const userId = await getUserIdFromToken(token);

		// Fetch user data from the database based on userId
		const user = await getUserById(userId); // Implement the function to retrieve user data
		const currGameUsers = await fetchCurrentGameUsers(userId);
		const pastGames = await fetchPastGames(userId);

		// Construct and send the response
		const responseData = {
			user: user,
			currGameUsers: currGameUsers,
			pastGames: pastGames
			// other relevant data
		};

		res.json(responseData);
	} catch (error) {
		console.error('Error decoding token:', error);
		res.status(401).json({ error: 'Invalid token' });
	}
};

router.get('/homepage', homepage_main);

module.exports = router;
const express = require('express');
const router = express.Router();
let authMiddleware = require('../middlewares/authMiddleware');
let db = require('../controllers/dbController');

// router.use(authMiddleware);

let homepage_main = async (req, res, next) => {
		const authHeader = req.headers.authorization;
	  
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
		  return res.status(401).json({ error: 'Invalid authorization header' });
		}
	  
		const token = authHeader.split(' ')[1]; // Extract the token part
		
		try {
			const userId = await authMiddleware.getUserIdFromToken(token);
		
			// Fetch user data from the database based on userId
			const user = await db.getUserById(userId); // Implement the function to retrieve user data
			const currGameUsers = await db.fetchCurrentGameUsers(userId);
			const pastGames = await db.fetchPastGames(userId);
			const aveRank = await db.fetchAveRanking(userId);
			const firstRank = await db.fetchNumber1stRankedGames(userId);
			const secondRank = await db.fetchNumber2ndRankedGames(userId);
			const thirdRank = await db.fetchNumber3rdRankedGames(userId);
		
			// Construct and send the response
			const responseData = {
			user: user,
			currGameUsers: currGameUsers,
			pastGames: pastGames,
			ranks: {
				aveRank: parseInt(aveRank['AVG(ranking)']),
				firstRank: firstRank['COUNT(ranking)'],
				secondRank: secondRank['COUNT(ranking)'],
				thirdRank: thirdRank['COUNT(ranking)']
			}
			};
		
			res.json(responseData);
		} catch (error) {
			
		  next(error);
		}
};

router.get('/homepage', homepage_main);

module.exports = router;
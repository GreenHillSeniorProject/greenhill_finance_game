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
		
			try {
				const user = await db.getUserById(userId);
				if (!user) throw new Error("User data not found");
			  
				const currGameUsers = await db.fetchCurrentGameUsers(userId);
				if (!currGameUsers) throw new Error("Current game users not found");
			  
				const pastGames = await db.fetchPastGames(userId);
				if (!pastGames) throw new Error("Past games not found");
			  
				const aveRank = await db.fetchAveRanking(userId);
				if (!aveRank) throw new Error("Average ranking not found");
			  
				const firstRank = await db.fetchNumber1stRankedGames(userId);
				if (!firstRank) throw new Error("First ranked games not found");
			  
				const secondRank = await db.fetchNumber2ndRankedGames(userId);
				if (!secondRank) throw new Error("Second ranked games not found");
			  
				const thirdRank = await db.fetchNumber3rdRankedGames(userId);
				if (!thirdRank) throw new Error("Third ranked games not found");
			  
			  } catch (error) {
				console.log("Error: ", error.message);
				const err = new Error(`Failed at operation: ${error.message}`);
				err.status = 400;
				next(err);
			  }
		
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
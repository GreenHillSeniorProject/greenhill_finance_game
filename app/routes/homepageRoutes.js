const express = require('express');
const router = express.Router();
let authMiddleware = require('../middlewares/authMiddleware');
let tokenCTLR = require('../controllers/tokenController');
let db = require('../controllers/dbController');

// router.use(authMiddleware);

let homepage_main = async (req, res, next) => {
		const authHeader = req.headers.authorization;
	  
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
		  return res.status(401).json({ error: 'Invalid authorization header' });
		}
	  
		const token = authHeader.split(' ')[1]; // Extract the token part
		
		try {
			const userId = await tokenCTLR.getUserIdFromToken(token);
			let user, currGameUsers, pastGames, aveRank, firstRank, secondRank, thirdRank;
			try {
				user = await db.getUserById(userId);
				if (!user) throw new Error("User data not found");
				
				currGameUsers = await db.fetchCurrentGameUsers(userId);
				if (!currGameUsers) throw new Error("Current game users not found");
				
				pastGames = await db.fetchPastGames(userId);
				if (!pastGames) throw new Error("Past games not found");
				
				aveRank = await db.fetchAveRanking(userId);
				if (!aveRank) throw new Error("Average ranking not found");
				
				firstRank = await db.fetchNumber1stRankedGames(userId);
				if (!firstRank) throw new Error("First ranked games not found");
			
				secondRank = await db.fetchNumber2ndRankedGames(userId);
				if (!secondRank) throw new Error("Second ranked games not found");
				
				thirdRank = await db.fetchNumber3rdRankedGames(userId);
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

router.get('/homepage', authMiddleware.authentication_main, homepage_main);

module.exports = router;
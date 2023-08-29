const express = require('express');
const router = express.Router();
let authMiddleware = require('../middlewares/authMiddleware');
let db = require('../controllers/dbController');
let tokenCTLR = require('../controllers/tokenController');


let portfolio_main = async (req, res) => {
	try {
		const token = req.headers.authorization.split(' ')[1];

        const userId = await tokenCTLR.getUserIdFromToken(token);
		// Fetch user data from the database based on userId
		const user = await db.getUserById(userId);

		const portfolioId = await db.fetchCurrentPortfolioId(userId);

		const portfolioValues = await db.fetchPortfolioValues(portfolioId);
		const stocks = await db.fetchPortfolioStocks(portfolioId);

        const data = { portfolioValues, stocks, portfolioId };
        console.log(data); //Debugging

		if (portfolioId) {
			res.json(data);
		} else {
			res.send({ message: "Portfolio does not exist" });
		}
	} catch (error) {
		res.send({ err: error.message });
	}
}

router.get('/portfolio', authMiddleware.authentication_main, portfolio_main);

module.exports = router;
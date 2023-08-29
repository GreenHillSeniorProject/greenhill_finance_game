const express = require('express');
const router = express.Router();
let authMiddleware = require('../middlewares/authMiddleware');


let updatePortf_main = async (req, res) => {
    try {
        console.log('hit route');
        const updatedPortfolioData = req.body;
        const portfolioId = updatedPortfolioData.portfolioId;
        const actions = updatedPortfolioData.actions;
        const startingObj = updatedPortfolioData.startingStocksObj;
        if (JSON.stringify(actions) === '{}') {
            console.log('actions is empty');
                res.send("No action performed");
        } else {
            console.log('actions is not empty');
            const validate = await validateSave(portfolioId,actions, startingObj);
            if (validate === true) {
                console.log('actions validated');
                res.send("Validation passed");
                await saveBuyAndSellStock(portfolioId,actions);
            } else {
                console.log('delete - validation did not pass');
                res.send(validate);
            }
        }
    } catch (error) {
      throw error;
    }
};

router.post('/update-portfolio', authMiddleware);

module.exports = router;
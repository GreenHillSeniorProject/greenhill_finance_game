const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

let logout_main = async (req, res, next) => {
    const { token } = req.body;
  
    if (!token) {
      res.status(400).json({ message: 'Token is missing in request' });
    }
  
    // Add the token to the invalidatedTokens blacklist
    invalidatedTokens.add(token);
  
    // TODO: You could also persist the blacklist in a file or database for better durability
  
    res.status(200).json({ message: 'Logout successful' });
}

router.post('/logout', logout_main);

module.exports = router;
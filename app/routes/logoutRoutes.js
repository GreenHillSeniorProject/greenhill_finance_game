const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

let logout_main = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization || !authorization.startsWith('Bearer ')) {
          return res.status(400).json({ message: 'Token is missing in request' });
        }

        let token = authorization.split(' ')[1];
  
        // Ensure token is not already invalidated
        if (invalidatedTokens.has(token)) {
            return res.status(400).json({ message: 'Token already invalidated' });
        }

        console.log("invalidating token reached");
        // Add the token to the invalidatedTokens blacklist
        await authMiddleware.invalidateToken(token); // ensure this is a valid async operation
  
        // TODO: You could also persist the blacklist in a file or database for better durability
  
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
}

router.post('/logout', logout_main);

module.exports = router;
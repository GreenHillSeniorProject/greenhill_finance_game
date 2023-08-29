const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

let logout_main = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            console.log("token is missing in the request");
            let err = new Error("token is missing in the request");
            err.status = 400;
            next(err);
        }
        let token = authorization.split(' ')[1];

        // Ensure token is not already invalidated
        if (authMiddleware.invalidatedTokens.has(token)) {
            console.log("token already blacklisted");
            let err = new Error("provided token has already been invalidated");
            err.status = 400;
            next(err);
        }

        // Add the token to the invalidatedTokens blacklist
        await authMiddleware.invalidateToken(token); // ensure this is a valid async operation
    
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.log("token is missing in the request");
        let err = new Error("token is missing in the request");
        err.status = 400;
        next(err);
    }
}

router.post('/logout', logout_main);

module.exports = router;
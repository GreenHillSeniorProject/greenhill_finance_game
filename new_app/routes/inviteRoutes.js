const express = require('express');
const router = express.Router();
const userController = require('../controllers/inviteControllers');

router.post('/invite-mailto', userController["invite-mailto"]);


module.exports = router;
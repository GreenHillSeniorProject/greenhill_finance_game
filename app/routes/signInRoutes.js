const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
let db = require('../controllers/dbController');
let jwtCTLR = require('../controllers/tokenController');

let signIn_main = async (req, res, next) => {
	let { email, password } = req.body;

	if (typeof email !== 'string' || typeof password !== 'string') {
		res.status(400).send({ message: "Invalid email or password format" });
		return;
	}

	let users;
	try {
		users = await db.runQuery('SELECT * FROM Users WHERE email = ?', [email]);
		if (users === null || users.length === 0) {
			throw new Error("User not found");
		}
		bcrypt.compare(password, users[0].password, async (err, isMatch) => {
			if (err) {
			  console.log("Error hashing password: ", err.message);
			  const newErr = new Error("Error hashing password");
			  newErr.status = 500;
			  return next(newErr);
			}
			if (isMatch) {
			  const token = await jwtCTLR.getTokenFromUserId(users[0].user_id);
			  return res.send({ token });
			} else {
			  console.log("Flag: found but no password match");
			  const newErr = new Error("Invalid email or password");
			  newErr.status = 400;
			  return next(newErr);
			}
		  });
	} catch (error) {
		// Error logging on server
		console.log("Error fetching users: ", error.message);

		// Error sent to client
		const err = new Error("Error fetching users");
		err.status = 500;
		next(err);
	}
}

router.post('/signin', signIn_main);

module.exports = router;
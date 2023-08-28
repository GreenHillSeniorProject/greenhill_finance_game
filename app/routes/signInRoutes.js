const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
let dbCTLR = require('../controllers/dbController');
let db = dbCTLR.db;
let jwtCTLR = require('../controllers/tokenController');

let signIn_main = async (req, res) => {
	let { email, password } = req.body;

	if (typeof email !== 'string' || typeof password !== 'string') {
		res.status(400).send({ message: "Invalid email or password format" });
		return;
	}

	db.query('SELECT * FROM Users WHERE email = ?', [email], (err, result) => {
		if (err) {
			res.status(500).send({ message: "error with database querying" });
		}
		if (result.length > 0) {
			bcrypt.compare(password, result[0].password, async (err, isMatch) => {
				if (err) {
					res.status(500).send({ message: "error hashing password" });
				}
				if (isMatch) {
					const token = await jwtCTLR.getTokenFromUserId(result[0].user_id);
					res.send({token});
				} else {
					res.status(400).send({ message: "Invalid email or password" });
					console.log("Flag: found but no password match");
				}
			});
		} else {
			res.status(500).send({ message: "Invalid email or password" });
			console.log("Flag: no results from database");
		}
	});
}

router.post('/signin', signIn_main);

module.exports = router;
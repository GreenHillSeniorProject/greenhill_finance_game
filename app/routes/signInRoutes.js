const express = require('express');
const router = express.Router();
//unused variable
// let util = require('util');
const bcrypt = require('bcrypt');
let dbCTLR = require('../controllers/dbController');
let db = dbCTLR.db;
//unused variable
let jwtCTLR = require('../controllers/tokenController');

let signIn_main = async (req, res) => {
	let { email, password } = req.body;

	console.log("request recieved");

  if (typeof email !== 'string' || typeof password !== 'string') {
	res.status(400).send({ message: "Invalid email or password format" });
	return;
  }

  db.query('SELECT * FROM Users WHERE email = ?', [email], (err, result) => {
	if (err) {
	  res.send({ err: err });
	}
	if (result.length > 0) {
	  bcrypt.compare(password, result[0].password, async (err, isMatch) => {
		if (err) {
		  res.send({ err: err });
		}
		if (isMatch) {
		  const token = await jwtCTLR.getTokenFromUserId(result[0].user_id);
		  res.send({token});
		} else {
		  res.status(400).send({ message: "Invalid email or password" });
		}
	  });
	} else {
	  res.status(500).send({ message: "Invalid email or password" });
	}
  });
}

router.post('/signin', signIn_main);

module.exports = router;
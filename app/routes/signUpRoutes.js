const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
let dbCTLR = require('../controllers/dbController');
let db = dbCTLR.db;
let jwtCTLR = require('../controllers/tokenController');

let signUp_main = async (req, res) => {
    const { first_name, last_name, username, email, phone_number, password, invitation_code } = req.body;

	if (typeof email !== 'string' || typeof password !== 'string') {
		res.status(400).send({ error: 'Invalid email or password format' });
		return;
	}

	console.log(req.body);
	console.log(invitation_code);
	try {
		const referralResult = await runQuery('SELECT referrer_id FROM Referrals WHERE referral_code = ?', [invitation_code]);
		if (referralResult.length === 0) {
			res.send({ error: 'Invalid invitation code' });
			return;
		}
		const referrer_id = referralResult[0].referrer_id;

		const hashedPassword = bcrypt.hashSync(password, 10);

		const insertResult = await runQuery('INSERT INTO Users (first_name, last_name, username, email, phone_number, password, invitation_code) VALUES (?, ?, ?, ?, ?, ?, ?)', 
		[first_name, last_name, username, email, phone_number, hashedPassword, invitation_code]);
		const user_id = insertResult.insertId;

		await runQuery('UPDATE Referrals SET is_used = 1, status = "accepted" WHERE referral_code = ?', [invitation_code]);

		const token = jwtCTLR.sign({ userId: user_id }, config.SECRET_KEY);

		res.send({ message: 'Account created successfully', token: token });
	} catch (error) {
		console.error('Error creating account:', error);
		res.status(500).send({ error: 'An error occurred while creating the account' });
	}
}

function runQuery(query, params) {
	return new Promise((resolve, reject) => {
		db.query(query, params, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
}

router.post("/signup", signUp_main);

module.exports = router;
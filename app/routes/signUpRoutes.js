let express = require('express');
let router = express.Router();
let bcrypt = require('bcrypt');
let dbCTLR = require('../controllers/dbController');
let db = dbCTLR.db;
let jwtCTLR = require('../controllers/tokenController');
let config = require('../../config.json');


let signUp_main = async (req, res, next) => {

    let { first_name, last_name, username, email, phone_number, password, invitation_code } = req.body;

	if (typeof email !== 'string' || typeof password !== 'string') {
		let error = new Error("Invalid email and/or password format");
    	error.status = 400;
    	next(error);
	}

	console.log(req.body);
	console.log(invitation_code);

	//check the invitation code iwth the database
	let referralResult;
	try {
		referralResult = await runQuery('SELECT referrer_id FROM Referrals WHERE referral_code = ?', [invitation_code]);
		if (referralResult === null || referralResult.length === 0) {
			throw new Error("Referral not found");
		}
		if (referralResult.length > 1) {
			throw new Error("Uuuuuhhhh... this isn't supposed to happen\nThere are multiple Referral Entries with more the same code");
		}
	} catch (error) {
		// Error logging on server
		console.log("Error fetching referral: ", error.message);

		// Error sent to client
		const err = new Error("Error fetching referral");
		err.status = 400;
		next(err);
	}

	// line not used, uncomment if necessary
	// const referrer_id = referralResult[0].referrer_id;

	//Hash the password using bcrypt
	let hashedPassword;
	try {
		hashedPassword = bcrypt.hashSync(password, 10);
	} catch (error) {
		//error logged on server
		console.log("Error hashing passwords: ", error.message);
		//error sent to client
		err = new Error("Error hashing passwords");
		err.status = 400;
		next(err);
	}

	//insert user into database
	let insertResult, user_id;
	try {
		insertResult = await runQuery('INSERT INTO Users (first_name, last_name, username, email, phone_number, password, invitation_code) VALUES (?, ?, ?, ?, ?, ?, ?)', [first_name, last_name, username, email, phone_number, hashedPassword, invitation_code]);
		user_id = insertResult.insertId;
	} catch (error) {
		// error logged on server
		console.log("Error inserting data into Users table: ", error.message);
		// error sent to client
		err = new Error("Error creating user");
		err.status = 400;
		next(err);
	}

	// update the referral to reflect that it's been used
	try {
		await runQuery('UPDATE Referrals SET is_used = 1, status = "accepted" WHERE referral_code = ?', [invitation_code]);
	} catch (error) {
		// Error logging on server
		console.log("Error updating Referrals: ", error.message);

		// Error sent to client
		const err = new Error("Error updating Referrals");
		err.status = 400;
		next(err);
	}

	let token;
	try {
		token = await jwtCTLR.getTokenFromUserId(user_id);
		if (token === null) {
			throw new Error("Token is null");
		}
	} catch (error) {
		// Error logging on server
		console.log("Error signing token: ", error.message);

		// Error sent to client
		const err = new Error("Error signing token");
		err.status = 400;
		next(err);
	}

	res.send({ message: 'Account created successfully', token: token });
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
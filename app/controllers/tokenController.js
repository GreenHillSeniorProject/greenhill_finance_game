let jwt = require('jsonwebtoken');
let config = require('../../config.json');
let SECRET_KEY = config.SECRET_KEY;

exports.getIdFromToken = (token) => {
    return jwt.verify(token, SECRET_KEY);
}

exports.getTokenFromUserId = (userId) => {
	return new Promise((resolve, reject) => {
		const payload = { userId }; // Create a payload object
		jwt.sign(payload, SECRET_KEY, (err, token) => {
			if (err) {
				return reject(err);
			}
			resolve(token);
		});
	});
};

exports.getUserIdFromToken = (token) => {
	return new Promise((resolve, reject) => {
		jwt.verify(token.toString(), SECRET_KEY, (err, payload) => {
			if (err) {
				console.log('in get user id error');
				return reject(err);
			}

			const userId = payload.userId; // Extract userId directly from payload
			resolve(userId);
		});
	});
};
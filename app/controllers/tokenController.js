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
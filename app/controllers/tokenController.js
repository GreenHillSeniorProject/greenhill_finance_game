let jwt = require('jsonwebtoken');
let config = require('../../config.json');
let SECRET_KEY = config.SECRET_KEY;

exports.getIdFromToken = (token) => {
    return jwt.verify(token, SECRET_KEY);
}
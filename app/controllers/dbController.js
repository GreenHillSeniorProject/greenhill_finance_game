let mysql = require("mysql2");
let config = require('../../config.json');

let db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: config.localhost_password,
    database: config.db_name,
    insecureAuth: true
});

exports.runQuery = (query, params) => {
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
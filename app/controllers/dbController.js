let mysql = require("mysql2");
let config = require('../../config.json');

const db = mysql.createConnection({
user: "root",
host: "localhost",
password: config.localhost_password,
database: config.db_name,
insecureAuth: true
});

module.exports = db;
let mysql = require("mysql");
let bodyParser = require('body-parser');
const config = require("../config.json");
let path = require('path');

const express = require("express");
let host_port = config.host_port;
let hostname = config.hostname;
let app = express();

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: config.db_hostname,
    port: config.db_port,
    user: config.db_user,
    password: config.db_password,
    databse: "mydb"
});

db.connect((err)=>{
    if(err){
        console.log(err.message);
    } else {
        console.log("successful connection to database");
    }
});

//GET Requests

app.get("/select", (req, res) => {
    db.query("SELECT * FROM mydb.Admin", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

app.get("/update", (req, res) => {
    db.query("UPDATE mydb.Admin SET first_name = 'Tested' WHERE admin_id=4", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

app.get("/user/createEmployee", (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'views', 'user', 'createEmployee.html'));
});

app.get("/delete", (req, res) => {
    db.query("DELETE FROM mydb.Admin where first_name='Server'", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

//POST REQUESTS
app.post("/user/createEmployee", (req, res) =>{
    console.log(req.body);
	let first_name = req.body.first_name;
	let last_name = req.body.last_name;
	let password = req.body.password; // will be secured at a later date
	let username = req.body.username;
	let email = req.body.email;


	db.query(`CALL mydb.insert_greenhill_employee("${first_name}", "${last_name}", "${email}", "${username}", "${password}")`);

	res.send("Account created");
});

app.use(bodyParser.urlencoded({extended: true}));

app.listen(host_port, hostname, () => {
    console.log(`http://${hostname}:${host_port}`);
});
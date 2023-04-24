// import required modules
let mysql = require("mysql");
let bodyParser = require('body-parser');
const config = require("../config.json");
let path = require('path');

// create express app
const express = require("express");
let host_port = config.host_port;
let hostname = config.hostname;
let app = express();

// configure the app to use bodyParser() to parse request bodies
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// create mysql database connection
const db = mysql.createConnection({
    host: config.db_hostname,
    port: config.db_port,
    user: config.db_user,
    password: config.db_password,
    database: "mydb"
});

// connect to the database and log success/failure
db.connect((err)=>{
    if(err){
        console.log(err.message);
    } else {
        console.log("Successful connection to database");
    }
});

//GET Requests

// handle GET request to select all entries from mydb.Advisor table
app.get("/select", (req, res) => {
    db.query("SELECT * FROM mydb.Advisor", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
        // let admins = result;
        // res.render('gallery', {admins: admins});
    });
});

// handle GET request to update first_name column in mydb.Advisor table
app.get("/update", (req, res) => {
    db.query("UPDATE mydb.Advisor SET first_name = ? WHERE advisor_id=?", ['Tested', 4], function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

// handle GET request to serve createAdvisor.html file
app.get("/user/createAdvisor", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/user/createAdvisor.html'));
});

// handle GET request to delete entry from mydb.Admin table
app.get("/delete", (req, res) => {
    db.query("DELETE FROM mydb.Advisor where first_name=?", ['Server'], function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});


// POST REQUESTS

// handle POST request to create new Advisor entry in mydb.Advisor table
app.post("/user/createAdvisor", (req, res) =>{
	let first_name = req.body.first_name;
	let last_name = req.body.last_name;
	let password = req.body.password; // will be encrypted at a later date
	let username = req.body.username;
	let email = req.body.email;

    // call stored procedure in mydb to insert new Advisor
	db.query(`CALL mydb.insert_advisor(?, ?, ?, ?, ?, 'NULL')`,
    [first_name, last_name, email, username, password],
    (err, result) => {
        if (err) {
            console.log(err)
        } else {
            res.redirect("/user/createAdvisor");
        }
    });
});

// handle POST request to delete an Advisor
app.post("/delete", (req, res) => {
    const advisor_id = req.body.advisor_id;
    db.query("DELETE FROM mydb.Advisor WHERE advisor_id=?", [advisor_id], function (err, result, fields) {
      if (err) throw err;
      res.redirect("/user/createAdvisor"); // redirect to the home page
    });
  });

app.use(bodyParser.urlencoded({extended: true}));

// start listening for incoming requests on specified hostname and port
app.listen(host_port, hostname, () => {
    console.log(`http://${hostname}:${host_port}`);
});
// import required modules
let mysql = require("mysql");
let bodyParser = require('body-parser');
const config = require("../config.json");
let path = require('path');
const bcrypt = require("bcrypt");
const jwt = require("jwt-simple");

// create express app
const express = require("express");
let host_port = config.host_port;
let hostname = config.hostname;
let app = express();

const MINLENGTH = 5;
const MAXLENGTH = 64;

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

// handle GET request to select all entries from mydb.Admin table
app.get("/select", (req, res) => {
    db.query("SELECT * FROM mydb.Admin", function (err, result, fields) {
        if (err) throw err;
        // res.send(result);
        let admins = result;
        res.render('gallery', {admins: admins});
    });
});

// handle GET request to update first_name column in mydb.Admin table
app.get("/update", (req, res) => {
    db.query("UPDATE mydb.Admin SET first_name = ? WHERE admin_id=?", ['Tested', 4], function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

// handle GET request to serve createEmployee.html file
app.get("/user/createEmployee", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/user/createEmployee.html'));
});

// handle GET request to delete entry from mydb.Admin table
app.get("/delete", (req, res) => {
    db.query("DELETE FROM mydb.Admin where first_name=?", ['Server'], function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

// POST REQUESTS
app.post('/login', async function (req, res) {
	let password = req.body.password;
	let email = req.body.email;

    email = email.toLowerCase();

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(validateString(password)) || !(password.length >= MINLENGTH && password.length <= MAXLENGTH)
    ) {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    } 

    let user = await getValue("GreenHillEmployee", "email", email);

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "No account exists"});
    }

    let hashedPassword = user[0].password;
    let accountExists = await validatePassword(password, hashedPassword);

    if (accountExists === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (accountExists === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    }

    let payload = {email: email, password: password}
    let username = user[0].username;

    res.status(SUCCESSSTATUS);
    return res.json({token: jwt.encode(payload, SECRET), username: username});
});

app.post('/create', async function (req, res) {
    let first_name = req.body.first_name;
	let last_name = req.body.last_name;
	let password = req.body.password; // will be encrypted at a later date
	let username = req.body.username;
	let email = req.body.email;

    email = email.toLowerCase();

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(validateString(username)) || !(validateString(password)) 
    ) {
        res.status(FAILSTATUS);
        return res.json({error: "Incomplete data"});
    } 

    if (!(username.length >= MINLENGTH && username.length <= MAXLENGTH) || (username.includes(" "))) {
        res.status(FAILSTATUS);
        return res.json({error: "Username needs to be at least five characters with no spaces"});
    }

    if (!(password.length >= MINLENGTH && password.length <= MAXLENGTH) || (password.includes(" "))) {
        res.status(FAILSTATUS);
        return res.json({error: "Password needs to be at least five characters with no spaces"});
    }

    let emailExists = await getValue("users", "email", email);
    let usernameExists = await getValue("users", "username", username);

    if (emailExists === "error" || usernameExists === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (emailExists !== "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account already exists"});
    } 

    if (usernameExists !== "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Username already exists"});
    }

    let hashedPassword = await createHashPassword(password);

    if (hashedPassword === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    let text = `CALL mydb.insert_greenhill_employee($1, $2, $3, $4, $5)`;
    let values = [first_name, last_name, password, username, email];
    let accountCreated = await mysqlCommand(text, values);

    if (accountCreated === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({success: "New account created"});
});

app.use(bodyParser.urlencoded({extended: true}));

// start listening for incoming requests on specified hostname and port
app.listen(host_port, hostname, () => {
    console.log(`http://${hostname}:${host_port}`);
});

async function validatePassword(password, hashedPassword) {
    try {
        const res = await bcrypt.compare(password, hashedPassword);

        if (res) {
            return "true";
        }

        return "false";

    } catch (err) {
        console.log(err.stack);
        return "error";
    }
}

async function createHashPassword(password) {
    try {
        const res = await bcrypt.hash(password, SALTROUNDS);

        return res;

    } catch (err) {
        console.log(err.stack);
        return "error";
    }
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

async function mysqlCommand(text, values) {
    try {
        const res = await db.query(text, values);

        return res.rows;

    } catch (err) {
        console.log(err.stack);
        return "error";
    } 
}

async function getValue(table, category, value) {
    let text = `SELECT * FROM ${table} WHERE ${category} = $1`;
    let values = [value];

    try {
        const res = await db.query(text, values);

        if (res.rows.length > 0) {
            return res.rows;
        }

        return "false";

    } catch (err) {
        console.log(err.stack);
        return "error";
    } 
}

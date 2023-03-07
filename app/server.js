const mysql = require("mysql");
const config = require("../config.json");
const express = require("express");
let host_port = config.host_port;
let hostname = config.hostname;
let app = express();

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

app.post("/insert/:admin_id", (req, res) => {

    let email = req.params.email;
    let first_name = req.params.first_name;
    let last_name = req.params.last_name;
    console.log(admin_id);
});

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

app.get("/insert", (req, res) => {
    db.query("INSERT INTO mydb.Admin (first_name, last_name, email) VALUES ('Server', 'Test', 'cool@gmool.com')", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
    res.sendFile(__dirname, '/public/insert.html');
});

app.get("/delete", (req, res) => {
    db.query("DELETE FROM mydb.Admin where first_name='Server'", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});


app.listen(host_port, hostname, () => {
    console.log(`http://${hostname}:${host_port}`);
});
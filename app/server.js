const mysql = require("mysql");
const config = require("../config.json");
const express = require("express");
let port = config.port;
let hostname = config.host;
let app = express();

const db = mysql.createConnection({
    host: "database-1.cpjwwrmrh8mc.us-east-1.rds.amazonaws.com",
    port: "3306",
    user: config.user,
    password: config.password,
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
    let admin_id = req.params.admin_id;
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
});

app.get("/delete", (req, res) => {
    db.query("DELETE FROM mydb.Admin where first_name='Server2'", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});


app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
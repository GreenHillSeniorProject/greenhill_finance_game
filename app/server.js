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

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
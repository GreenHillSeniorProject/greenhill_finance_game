const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "password",
    database: "GreenHill_LocalHost",
    insecureAuth: true
});

app.post("/signup", (req, res) => {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    db.query('INSERT INTO GreenhillEmployee (first_name, last_name, email, username, password) VALUES (?, ?, ?, ?, ?)', [first_name, last_name, email, username, password], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send({ message: 'Account created successfully' });
        }
    })
});

app.post("/signin", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    db.query('SELECT * FROM GreenhillEmployee WHERE email = ? AND password = ?', 
    [email, password], 
    (err, result) => {
        if (err) {
            res.send({ err: err });
        } 
        
        if (result.length > 0) {
            res.send(result);
        } else {
            res.send({message: "Account does not exist"});
        }
    })
})

app.listen(3001, () => {
    console.log("local host server running")
});
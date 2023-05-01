// import required modules
let mysql = require("mysql");
let bodyParser = require('body-parser');
const config = require("../config.json");
let path = require('path');
const axios = require('axios');
const cors = require("cors");

// finnhub API stuff
const finnhub = require('finnhub');
const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = "ch7m6n9r01qt83gcd2b0ch7m6n9r01qt83gcd2bg" // Replace this
const apiKey = "ch7m6n9r01qt83gcd2b0ch7m6n9r01qt83gcd2bg";
const finnhubClient = new finnhub.DefaultApi()


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
app.use(cors());

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

// handle GET request to login
app.get("/user/login", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/user/login.html'));
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


// handle POST request to login
app.post("/user/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    console.log(username);
    console.log(password);
    db.query("SELECT * FROM mydb.Advisor WHERE username=?", [username], function (err, result, fields) {
      if (err) throw err;
      res.redirect("/user/login"); // redirect to the home page
      if (result.length == 0) {
        console.log("---------> User does not exist");
        //res.sendStatus(404);
      }
      else {
        //const hashedPassword = result[0].password;
        //if (bcrypt.compare(password, hashedPassword)) {
        if (result[0].password == password) {
            console.log("---------> Login Successful");
            //res.send(`${username} is logged in!`);
        } 
        else {
            console.log("---------> Password Incorrect");
            //res.send("Password incorrect!");
        }
      }
    });
});

const main = async () => {
    const symbols = ['MSFT', 'META', 'TSLA']; // add more symbols here
    for (const symbol of symbols) {
      const stock = await getStockInfo(symbol);
      if (stock != null) {
        await insertStock(stock);
        console.log(`Inserted stock info for ${symbol} into database.`);
      }
    }
};

// finnhub

// insert a stock record into the database
const insertStock = async (stock) => {
    const sql = 'INSERT IGNORE INTO Stocks (ticker, description, dividend) VALUES (?, ?, ?)';
    const values = [stock.symbol, stock.description, stock.price];
    return new Promise((resolve, reject) => {
        db.query(sql, values, (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
};

const getStockInfo = async (symbol) => {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
      const data = response.data;
      return {
        symbol: symbol,
        price: data.c,
        description: data.description
      };
    } catch (error) {
      console.error(`Error fetching stock info for symbol ${symbol}: ${error.message}`);
      return null;
    }
};

  
app.use(bodyParser.urlencoded({extended: true}));

// start listening for incoming requests on specified hostname and port
app.listen(host_port, hostname, () => {
    console.log(`http://${hostname}:${host_port}`);
});

main();

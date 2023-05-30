// Import necessary modules
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require('axios');
const config = require('../config.json');

// Create Express app and set up middleware
const app = express();
app.use(express.json());
app.use(cors());

// Create MySQL database connection
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: config.password,
  database: "greenhill_localhost",
  insecureAuth: true
});

// fetch FAQ data
app.get('/faq', (req, res) => {
  var sql = 'SELECT * FROM faq';
  db.query(sql, (err, data) => {
    if (err) {throw err;}
    else {
      // Send the data as a JSON response
      res.json(data);
      console.log(data);
    };
});
});

// Route for handling user sign up requests
app.post("/signup", (req, res) => {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  db.query('INSERT INTO GreenhillEmployee (first_name, last_name, email, username, password) VALUES (?, ?, ?, ?, ?)',
    [first_name, last_name, email, username, password],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send({ message: 'Account created successfully' });
      }
    })
});

// Route for handling user sign in requests
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
        res.send({ message: "Account does not exist" });
      }
    })
})

//Handle buy request
app.post("/buy", (req, res) => {
  const advisor_id = req.body.advisor_id;

  db.query('SELECT * FROM GreenhillEmployee WHERE user = ? AND password = ?',
    [email, password],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (result.length > 0) {
        res.send(result);
      } else {
        res.send({ message: "Account does not exist" });
      }
    })
})

// Main function to fetch stock info for multiple symbols and insert into database
const main = async () => {
  /*
  const symbols = ['AAPL', 'GOOG', 'AMZN']; // add more symbols here
  for (const symbol of symbols) {
    const stock = await getStockInfo(symbol);
    const stockInDB = await getStockFromDB(symbol);
    if (stock !== null && (stockInDB === null || stockInDB.length === 0)) {
      try {
        await insertStock(stock);
        console.log(`Inserted stock info for ${symbol} into database.`);
      } catch (error) {
        console.error(`Error inserting stock info for ${symbol}: ${error.message}`);
      }
    } else {
      console.log(`Skipping duplicate entry for ${stock.symbol}`);
    }
  } */
};

app.listen(3001, () => {
  console.log("local host server running")
});

main();
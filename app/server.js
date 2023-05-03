// Import necessary modules
const express = require("express");
const mysql = require("mysql");
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
  password: config.db_localhost,
  database: "GreenHill_LocalHost",
  insecureAuth: true
});

// Function to fetch stock info for a given symbol from an external API (Polygon)
const getStockInfo = async (symbol) => {
  try {
    const response = await axios.get(`https://api.polygon.io/v1/meta/symbols/${symbol}/company?apiKey=${config.polygonApiKey}`);
    const data = response.data;
    return {
      symbol: symbol,
      price: data.lastQuotePrice,
      description: data.description
    };
  } catch (error) {
    console.error(`Error fetching stock info for symbol ${symbol}: ${error.message}`);
    return null;
  }
};

// Function to insert stock info into MySQL database
const insertStock = async (stock) => {
  const sql = 'INSERT INTO Stocks (ticker, description) VALUES (?, ?)';
  const values = [stock.symbol, stock.description];
  try {
    const result = await db.query(sql, values);
    return result;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log(`Skipping duplicate entry for ${stock.symbol}`);
      return null;
    } else {
      throw error;
    }
  }
};

// Function to fetch stock info for a given symbol from MySQL database
const getStockFromDB = async (symbol) => {
  const sql = 'SELECT * FROM Stocks WHERE ticker = ?';
  const values = [symbol];
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

// Main function to fetch stock info for multiple symbols and insert into database
const main = async () => {
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
  }
};

app.listen(3001, () => {
  console.log("local host server running")
});

main();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const axios = require('axios');
const config = require('../config.json');

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

// make a request to the polygon API to get stock info
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

// insert a stock record into the database
const insertStock = async (stock) => {
    const sql = 'INSERT INTO Stocks (ticker, description) VALUES (?, ?)';
    const values = [stock.symbol, stock.description];
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

// main function that fetches stock info and inserts it into the database
const main = async () => {
    const symbols = ['AAPL', 'GOOG', 'AMZN']; // add more symbols here
    for (const symbol of symbols) {
      const stock = await getStockInfo(symbol);
      if (stock !== null) {
        await insertStock(stock);
        console.log(`Inserted stock info for ${symbol} into database.`);
      }
    }
};

app.listen(3001, () => {
    console.log("local host server running")
});

main();
// Import necessary modules
const csv = require("csv-parser");
const fs = require("fs");
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
    const response = await axios.get(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${config.polygonApiKey}`);
    const data = response.data;
    return {
      symbol: symbol,
      price: data.lastQuotePrice,
      description: data.results.description
    };
  } catch (error) {
    console.error(`Error fetching stock info for symbol ${symbol}: ${error.message}`);
    return null;
  }
};

// Create a variable to track the delay between requests
let delay = 1000; // 1 second

// Function to delay the execution for the specified duration
const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

// Function to fetch stock info for a given symbol from an external API (Yahoo)
/* const getStockInfo = async (symbol) => {
  const options = {
    method: 'GET',
    url: `https://yahoo-finance127.p.rapidapi.com/price/${symbol}`,
    headers: {
      'X-RapidAPI-Key': config.yahooApiKey,
      'X-RapidAPI-Host': 'yahoo-finance127.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    const data = response.data;
    return {
      symbol: symbol,
      price: data.regularMarketPrice,
      description: data.longName
    };
  } catch (error) {
    console.error(`Error fetching stock info for symbol ${symbol}: ${error.message}`);
    return null;
  }
};
 */

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
app.post("/signup", async (req, res) => {
  const { first_name, last_name, username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO Employees (first_name, last_name, email, username, password) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, email, username, hashedPassword]
    );
    res.send({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).send({ error: 'An error occurred while creating the account' });
  }
});

// Route for handling user sign in requests
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM Employees WHERE email = ?', [email]);
    if (result.length === 0) {
      res.status(404).send({ message: "Account does not exist" });
      return;
    }

    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).send({ message: "Incorrect password" });
      return;
    }

    // Remove the password field from the response for security
    delete user.password;
    res.send(user);
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).send({ error: 'An error occurred while signing in' });
  }
});



// Main function to fetch stock info for multiple symbols and insert into database using Polygon API
const main = async () => {
  // const symbols = ['AAPL', 'GOOG', 'AMZN']; // add more symbols here
  const symbols = [];
  fs.createReadStream('constituents.csv')
    .pipe(csv())
    .on('data', (data) => {
      symbols.push(data.Symbol)
    })
    .on('end', async() => {
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
        await sleep(delay);
      }
    })
};


// Main function to fetch stock info for multiple symbols and insert into database using Yahoo Finance API
/* const main = async () => {
  const symbols = [];
  fs.createReadStream('constituents.csv')
    .pipe(csv())
    .on('data', (data) => {
      symbols.push(data.Symbol);
    })
    .on('end', async () => {
      for (const symbol of symbols) {
        const stock = await getStockInfo(symbol);
        const stockInDB = await getStockFromDB(symbol);
        if (stock !== null && (stockInDB === null || stockInDB.length === 0)) {
          try {
            await insertStock(stock);
            console.log(`Inserted stock info for ${symbol} into the database.`);
          } catch (error) {
            console.error(`Error inserting stock info for ${symbol}: ${error.message}`);
          }
        } else {
          console.log(`Skipping duplicate entry for ${symbol}`);
        }
        // Delay between requests to avoid rate limiting
        await sleep(delay);
      }
    });
}; */

app.listen(3001, () => {
  console.log("local host server running")
});

main();
// Import necessary modules
const csv = require("csv-parser");
const fs = require("fs");
const express = require("express");
const moment = require("moment");
const mysql = require("mysql");
const cors = require("cors");
const axios = require('axios');
const bcrypt = require('bcrypt');
const util = require('util');
const config = require('../config.json');
//const jwt = require("jwt-simple");

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

// Function to fetch stock info for a given symbol from an external API (Polygon)
const getStockInfo = async (symbol) => {
  try {
    const response = await axios.get(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${config.polygonApiKey}`);
    const data = response.data;
    return {
      symbol: symbol,
      description: data.results.description
    };
  } catch (error) {
    console.error(`Error fetching stock info for symbol ${symbol}: ${error.message}`);
    return null;
  }
};

// Create a variable to track the delay between requests
const delay = 5 * 60 * 1000; // 5 minutes

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
    const result = await util.promisify(db.query).bind(db)(sql, values);
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

// Function to fetch stock prices from the market data endpoint and insert into StockHistory table
const insertStockHistory = async (stockId, high, low, open, close) => {
  const sql = 'INSERT INTO StockHistory (stock_id, high, low, open, close) VALUES (?, ?, ?, ?, ?)';
  const values = [stockId, high, low, open, close];
  try {
    const result = await util.promisify(db.query).bind(db)(sql, values);
    return result;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log(`Skipping duplicate entry for stock_id ${stockId}`);
      return null;
    } else {
      throw error;
    }
  }
};

// Function to update stock prices in the StockHistory table
const updateStockHistory = async (stockId, high, low, open, close) => {
  const sql = 'UPDATE StockHistory SET high = ?, low = ?, open = ?, close = ? WHERE stock_id = ?';
  const values = [high, low, open, close, stockId];

  try {
    const result = await util.promisify(db.query).bind(db)(sql, values);
    return result;
  } catch (error) {
    throw error;
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

// Function to fetch stock history info for a given symbol from MySQL database
const getStockHistoryFromDB = async (symbol) => {
  const sql = 'SELECT * FROM StockHistory WHERE stock_id = ?';
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

// Function to generate a new referral code
function generateReferralCode() {
  // Generate a unique referral code according to your requirements
  // For example, you can use a combination of letters and numbers
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const referralCodeLength = 8;
  let referralCode = '';

  for (let i = 0; i < referralCodeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }

  return referralCode;
}


// Route for handling user sign up requests
app.post("/signup", async (req, res) => {
  const { first_name, last_name, username, email, phone_number, password, invitation_code } = req.body;

  // Generate a new referral code
  const referral_code = generateReferralCode();

  try {
    // Validate the invitation code
    const referralQuery = 'SELECT referrer_id FROM Referrals WHERE referral_code = ?';
    const referralQueryAsync = util.promisify(db.query).bind(db);
    const referralResult = await referralQueryAsync(referralQuery, [invitation_code]);

    if (referralResult.length === 0) {
      res.send({ error: 'Invalid invitation code' });
      return;
    }

    const referrer_id = referralResult[0].referrer_id;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const userQuery = 'INSERT INTO Users (first_name, last_name, username, email, phone_number, password, invitation_code) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const userQueryAsync = util.promisify(db.query).bind(db);
    await userQueryAsync(userQuery, [first_name, last_name, username, email, phone_number, hashedPassword, invitation_code]);

    // Insert the referral information
    const referralInsertQuery = 'INSERT INTO Referrals (referrer_id, referred_email, referral_code, status, expiration_date) VALUES (?, ?, ?, ?, ?)';
    const expiration_date = new Date();
    expiration_date.setDate(expiration_date.getDate() + 7); // Set the expiration date to 7 days from the current date
    const referralInsertQueryAsync = util.promisify(db.query).bind(db);
    await referralInsertQueryAsync(referralInsertQuery, [referrer_id, email, referral_code, 'pending', expiration_date]);

    // Update the referral information
    const referralUpdateQuery = 'UPDATE Referrals SET is_used = 1, status = "accepted" WHERE referral_code = ?';
    const referralUpdateQueryAsync = util.promisify(db.query).bind(db);
    await referralUpdateQueryAsync(referralUpdateQuery, [invitation_code]);

    res.send({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).send({ error: 'An error occurred while creating the account' });
  }
});

// Route for handling user sign in requests
app.post("/signin", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query('SELECT * FROM Users WHERE email = ? AND password = ?',
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

        if (stockInDB !== null && stockInDB.length > 0) {
          const stockId = stockInDB[0].stock_id;
          const date = '2023-06-30'; // specify the date for which you want to fetch the market data
  
          try {
            const response = await axios.get(`https://api.polygon.io/v1/open-close/${symbol}/${date}?apiKey=${config.polygonApiKey}`);
            const data = response.data;
            const { high, low, open, close } = data;
  
            const stockHistoryInDB = await getStockHistoryFromDB(stockId, date);
  
            if (stockHistoryInDB !== null && stockHistoryInDB.length > 0) {
              // Update existing stock history
              await updateStockHistory(stockId, high, low, open, close);
              console.log(`Updated stock history for ${symbol} in the database.`);
            } else {
              // Insert new stock history
              await insertStockHistory(stockId, high, low, open, close);
              console.log(`Inserted stock history for ${symbol} into the database.`);
            }
          } catch (error) {
            console.error(`Error inserting/updating stock history for ${symbol}: ${error.message}`);
          }
        } else {
          console.log(`No stock information found for ${symbol} in the database.`);
        }
  
        await sleep(delay);
      }
    });
    
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


/*
app.post("/create", (req, res) => {
  const type = req.body.type;
  const fund = req.body.fund;
  const start = req.body.start;
  const end = req.body.end;
  const sponsor = req.body.sponsor;

  var createTable = 'INSERT INTO GameInfo (game_id, employee_id, starting_cash, start_date, end_date, sponsor) SELECT ?, employee_id, ?, ?, ?, ? FROM Users'
  var values = [type, fund, start, end, sponsor];

  db.query(createTable, values,
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }
      console.log("Game created.")
    })
});

app.post("/changeAdvisorInfo", (req, res) => {
  let token = req.body.token;
  let newUsername = req.body.username;
  let newPhoneNumber = req.body.phone_number;
  let newPassword = req.body.password;

    let user = await getUserFromToken(token);

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account does not exist"});
    } 

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Invalid token"});
    }

    let id = user.employee_id;
    let newHashedPassword = await bcrypt.hash(newPassword, 10);
    let sql = `UPDATE Users SET username = ?, phone_number = ?, password = ?  WHERE id = ?`;
    let values = [newUsername, newPhoneNumber, newHashedPassword, id];

    if (killCreated === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({info: newUsername, success: "Changed"});
});

async function getUserFromToken(token) {
  try {
      let decoded = jwt.decode(token, SECRET);

      let user = await getValue("Users", "email", decoded.email);

      if (user === "false") {
          return "false";
      }

      let hashedPassword = user[0].password; 
      let accountExists = await validatePassword(decoded.password, hashedPassword);

      if (accountExists === "true") {
          return user[0];
      }

      return "false";

  } catch (err) {
      return "error";
  }
};

async function getValue(table, category, value) {
  let text = `SELECT * FROM ${table} WHERE ${category} = $1`;
  let values = [value];

  try {
      const res = await pool.query(text, values);
      
      if (res.rows.length > 0) {
          return res.rows;
      }

      return "false";

  } catch (err) {
      console.log(err.stack);
      return "error";
  } 
}


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
};
*/

app.listen(3001, () => {
  console.log("local host server running")
});

main();
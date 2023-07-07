// Import necessary modules
const csv = require("csv-parser");
const fs = require("fs");
const express = require("express");
const moment = require("moment");
const mysql = require("mysql2");
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
  password: config.password,
  database: "greenhill_localhost",
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


// Function to buy stock by shares and update portfolio
const buyStockByShare = async (portfolioId, stockId, quantity) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cashBalanceResult = await fetchCashBalance(portfolioId);
      const stockPriceResult = await fetchStockPrice(stockId);

      const cashBalance = cashBalanceResult[0].cash_value
      const stockPrice = stockPriceResult[0].high
      const totalCost = stockPrice * quantity;

      console.log(cashBalance);
      console.log(stockPrice);
      console.log(totalCost);

      if (cashBalance >= totalCost) {
        const newCashBalance = cashBalance - totalCost
        await updateCashBalance(portfolioId, newCashBalance);
        await updateStockQuantity(portfolioId, stockId, quantity);
        resolve(newCashBalance);

        console.log("Purchase successful!")
        console.log("New cash balance: " + newCashBalance);
      } else {
        reject(new Error('Insufficient balance'));
      }
    } catch(error) {
      reject(error);
    }
  });
};

// Function to sell stock by shares and update portfolio
const sellStockByShare = async (portfolioId, stockId, quantity) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cashBalanceResult = await fetchCashBalance(portfolioId);
      const stockPriceResult = await fetchStockPrice(stockId);

      const cashBalance = parseFloat(cashBalanceResult[0].cash_value)
      const stockPrice = stockPriceResult[0].high
      const totalCost = stockPrice * quantity;

      console.log(typeof(cashBalance));
      console.log(typeof(totalCost));

      const currentStockQuantity = await fetchStockQuantity(portfolioId, stockId); // number of shares portfolio currently has
      if (currentStockQuantity >= quantity) {
        const newCashBalance = cashBalance + totalCost
        await updateCashBalance(portfolioId, newCashBalance);
        await updateStockQuantity(portfolioId, stockId, -quantity);

        console.log("Sale successful!")
        console.log("New cash balance: " + newCashBalance);
      } else {
        reject(new Error('Insufficient stock quantity to sell'));
      }
    } catch(error) {
      reject(error);
    }
  });
};

// Function to fetch user's portfolio's cash balance
const fetchCashBalance = async (portfolioId) => {
  const sql = 'SELECT cash_value FROM Portfolios WHERE portfolio_id = ?'
  const values = [portfolioId];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to fetch stock price - (not sure which price to use so i picked high)
function fetchStockPrice(stockId) {
  const sql = 'SELECT high FROM StockHistory WHERE stock_id = ?';
  const values = [stockId];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to fetch portfolio's stock quantity
function fetchStockQuantity(portfolioId, stockId) {
  const sql = 'SELECT shares FROM portfolioStock WHERE portfolio_id = ? AND stock_id = ?';
  const values = [portfolioId, stockId];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        if (results.length > 0) {
          resolve(results[0].shares)
        } else {
          resolve(0);
        }
      }
    });
  });
}

// Function to update portfolio cash value
function updateCashBalance(portfolioId, newBalance) {
  const sql = `UPDATE portfolios SET cash_value = ? WHERE portfolio_id = ?`;
  const values = [newBalance, portfolioId];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to update portfolio stock quantity
async function updateStockQuantity(portfolioId, stockId, quantity) {
  const records = await checkPortfolioStockRecord(portfolioId, stockId);
  if (records.length > 0) {
    // record exists, perform update
    const current_shares = records[0].shares
    const sql = `UPDATE portfolioStock SET shares = ? WHERE portfolio_id = ? AND stock_id = ?`
    const values = [current_shares + quantity, portfolioId, stockId];

    return new Promise((resolve, reject) => {
      db.query(sql, values, (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
          console.log("Record updated")
        }
      });
    });
  } else {
    // record doesn't exist, perform insert
    const sql = `INSERT INTO portfolioStock (portfolio_id, stock_id, shares) VALUES (?, ?, ?)`
    const values = [portfolioId, stockId, quantity];

    return new Promise((resolve, reject) => {
      db.query(sql, values, (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
          console.log("Record inserted")
        }
      });
    });

  }
}

// Function to check if portfolio stock record exists
function checkPortfolioStockRecord(portfolioId, stockId) {
  const sql = `SELECT * FROM portfolioStock WHERE portfolio_id = ?  AND stock_id = ?`
  const values = [portfolioId, stockId,];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

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

  // test buyStockByShare function
  // await(buyStockByShare(2, 112, 1));
  await(sellStockByShare(2, 112, 1));

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
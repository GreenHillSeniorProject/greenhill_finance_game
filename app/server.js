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
const referralCodeGenerator = require('referral-code-generator');
const cron = require('node-cron');
//const jwt = require("jwt-simple");

// Schedule task to run at 5 PM every day
cron.schedule('0 17 * * *', async () => {
  try {
    await updatePortfolioDayValue();
    console.log('End of day portfolio value updated successfully.');
  } catch (error) {
    console.error('Error updating end of day portfolio value:', error);
  }
});

// Create Express app and set up middleware
const app = express();
app.use(express.json());
app.use(cors());

// Create MySQL database connection
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: config.password,
  database: config.db_name,
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
const delay = 1000 * 12; // 12 seconds

// Function to delay the execution for the specified duration
const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

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

// Function to validate if portfolio changes can be saved
const validateSave = async (portfolioId) => {
  const lastSave = await(fetchLastSave(portfolioId));
  const currDate = new Date();
  currDate.setHours(0,0,0,0);
  console.log(lastSave);
  console.log(currDate);
  if (lastSave >= currDate()) {
    console.log("You have already made changes to your portfolio today. These changes will not be saved.")
  }

  // check num of unique stocks
  const numStocks = await(fetchStockCount(portfolioId));
  
  // check non negative cash balance
}
/*
// Function to see portfolio value results after a list of transactions
const processActions = async (portfolioId, actions) => {
  return new Promise(async (resolve, reject) => {
    let transactionSuccessful = false;

    try {
      const portfolioValues = await fetchPortfolioValues(portfolioId);
      let cashBalance = parseFloat(portfolioValues.cash_value, 2);
      let assetValue = parseFloat(portfolioValues.asset_value, 2);
      let portfolioValue = parseFloat(portfolioValues.portfolio_value, 2);

      console.log(`Original cash balance: ${cashBalance}`);

      // Create a savepoint to allow rolling back to the initial state
      await createSavepoint();

      for (const action of actions) {
        console.log(action);
        const { type, stockId, quantity, amount } = action;
        const stockPrice = await fetchStockPrice(stockId);
        let totalCost = stockPrice * quantity;

        if (type === 'buyShare') {
          if (portfolioValue >= totalCost) {
            cashBalance -= totalCost;
            assetValue += totalCost;
            portfolioValue = cashBalance + assetValue;

            await updateStockQuantity(portfolioId, stockId, quantity);
            console.log(`Purchased ${quantity} shares of stock ${stockId} for ${totalCost}`);
          } else {
            console.log(`Skipping buyShare action for stock ${stockId} due to insufficient balance`);
          }
        } else if (type === 'sellShare') {
          const currentStockQuantity = await fetchStockQuantity(portfolioId, stockId); // number of shares the portfolio currently has

          if (currentStockQuantity >= quantity) {
            cashBalance += totalCost;
            assetValue -= totalCost;
            portfolioValue = cashBalance + assetValue;

            await updateStockQuantity(portfolioId, stockId, -quantity);
            console.log(`Sold ${quantity} shares of stock ${stockId} for ${totalCost}`);
          } else {
            console.log(`Skipping sellShare action for stock ${stockId} due to insufficient stock quantity`);
          }
        } 
      }

      await updatePortfolioValues(portfolioId, assetValue, cashBalance, portfolioValue);
      console.log("New cash balance: " + cashBalance);

      if (cashBalance >= 0) {
        resolve(cashBalance);
      } else {
        reject(new Error('Negative cash balance at the end of transactions'));
      }
    } catch (error) {
      reject(error);
    }
  });
};
*/

// Function to get timestamp of last portfolio save
const fetchLastSave = async (portfolioId) => {
  const sql = 'SELECT last_save FROM Portfolios WHERE portfolio_id = ?';
  const values = [portfolioId];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        console.log(typeof(results[0].last_save));
        resolve(results[0].last_save);
      }
    });
  });
}

// Function to buy stock by shares and update portfolio
const buyStockByShare = async (portfolioId, stockId, quantity) => {
  // Fetch portfolio values
  try {
    const { cash_value, asset_value, portfolio_value } = await fetchPortfolioValues(portfolioId);
    const cashBalance = parseFloat(cash_value, 2);
    const assetValue = parseFloat(asset_value, 2);
    const portfolioValue = parseFloat(portfolio_value, 2);

    console.log(`Original cash balance: ${cashBalance}`);

    const stockPrice = await fetchStockPrice(stockId);
    const totalCost = stockPrice * quantity;

    if (portfolioValue >= totalCost) {
      const newCashBalance = cashBalance - totalCost
      const newAssetValue = assetValue + totalCost
      const newPortfolioValue = newCashBalance + newAssetValue;

      await updateStockQuantity(portfolioId, stockId, quantity);
      await updatePortfolioValues(portfolioId, newAssetValue, newCashBalance, newPortfolioValue);

      console.log(`Purchased ${quantity} shares of stock ${stockId} for ${totalCost}`)
      console.log("New cash balance: ", newCashBalance);

      return newCashBalance;
    } else {
      throw new Error('Insufficient balance');
    }
  } catch (error) {
    throw error;
  }
};

// Function to sell stock by shares and update portfolio
const sellStockByShare = async (portfolioId, stockId, quantity) => {
  try {
    // Fetch portfolio values
    const { cash_value, asset_value } = await fetchPortfolioValues(portfolioId);
    const cashBalance = parseFloat(cash_value, 2);
    const assetValue = parseFloat(asset_value, 2);

    console.log(`Original cash balance: ${cashBalance}`);

    const stockPrice = await fetchStockPrice(stockId);
    const totalCost = stockPrice * quantity;
    const currentStockQuantity = await fetchStockQuantity(portfolioId, stockId);

    if (currentStockQuantity >= quantity) {
      const newCashBalance = cashBalance + totalCost
      const newAssetValue = assetValue - totalCost;
      const newPortfolioValue = newCashBalance + newAssetValue;

      await updateStockQuantity(portfolioId, stockId, -quantity);
      await updatePortfolioValues(portfolioId, newAssetValue, newCashBalance, newPortfolioValue);

      console.log(`Sold ${quantity} shares of stock ${stockId} for ${totalCost}`)
      console.log("New cash balance: ", newCashBalance);

      return newCashBalance;
    } else {
      throw new Error('Insufficient stock quantity to sell');
    }
  } catch(error) {
    throw(error);
  }
};

// Function to buy stock by cash amount and update portfolio
const buyStockByCashAmount = async (portfolioId, stockId, amount) => {
  try {
    const stockPrice = await fetchStockPrice(stockId);
    const stockQuantity = Math.floor(amount / stockPrice); // number of shares that can be purchased with given cash amount
    return await buyStockByShare(portfolioId, stockId, stockQuantity);
  } catch(error) {
    throw(error);
  }
};

// Function to buy stock by cash amount and update portfolio
const sellStockByCashAmount = async (portfolioId, stockId, amount) => {
  try {
    const stockPrice = await fetchStockPrice(stockId);
    const stockQuantity = Math.floor(amount / stockPrice); // number of shares that can be purchased with given cash amount
    return await sellStockByShare(portfolioId, stockId, stockQuantity);
  } catch(error) {
    throw(error);
  }
};

const fetchPortfolioValues = async (portfolioId) => {
  const sql = 'SELECT cash_value, asset_value, portfolio_value FROM Portfolios WHERE portfolio_id = ?'
  const values = [portfolioId];
  const query = util.promisify(db.query).bind(db);

  try {
    const results = await query(sql, values);
    return results[0];
  } catch (error) {
    throw error;
  }
};

const updatePortfolioValues = async (portfolioId, assetValue, cashValue, portfolioValue) => {
  const sql = 'UPDATE Portfolios SET asset_value = ?, cash_value = ?, portfolio_value = ? WHERE portfolio_id = ?'
  const values = [assetValue, cashValue, portfolioValue, portfolioId];
  const query = util.promisify(db.query).bind(db);

  try {
    const results = await query(sql, values);
    return results;
  } catch (error) {
    throw error;
  }
};

// Function to fetch stock price (based on opening price)
const fetchStockPrice = (stockId) => {
  const sql = 'SELECT open FROM StockHistory WHERE stock_id = ?';
  const values = [stockId];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(parseFloat(results[0].open, 2));
      }
    });
  });
};

const fetchStockQuantity = (portfolioId, stockId) => {
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
};

// Function to fetch number of unique stocks in porfolio
const fetchStockCount = (portfolioId) => {
  const sql = 'SELECT COUNT(*) as count FROM portfolioStock WHERE portfolio_id = ?';
  const values = [portfolioId];
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        if (results.length > 0) {
          resolve(results[0].count);
        } else {
          resolve(0);
        }
      }
    });
  });
};

// Function to update portfolio stock quantity
const updateStockQuantity = async (portfolioId, stockId, quantity) => {
  const records = await checkPortfolioStockRecord(portfolioId, stockId);
  if (records.length > 0) {
    // record exists, perform update
    const currentShares = records[0].shares;
    const sql = `UPDATE portfolioStock SET shares = ? WHERE portfolio_id = ? AND stock_id = ?`;
    const values = [currentShares + quantity, portfolioId, stockId];

    return new Promise((resolve, reject) => {
      db.query(sql, values, (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  } else {
    // record doesn't exist, perform insert
    const sql = `INSERT INTO portfolioStock (portfolio_id, stock_id, shares) VALUES (?, ?, ?)`;
    const values = [portfolioId, stockId, quantity];

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
};

// Function to check if portfolio stock record exists
const checkPortfolioStockRecord = (portfolioId, stockId) => {
  const sql = `SELECT * FROM portfolioStock WHERE portfolio_id = ?  AND stock_id = ?`;
  const values = [portfolioId, stockId];
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

// track end of day portfolio value
const updatePortfolioDayValue = async (portfolioId) => {
  const sql = 'UPDATE portfolios SET yesterday_value = portfolio_value';
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


const generateReferalCode = async () => {
  return referralCodeGenerator.alpha('uppercase', 4);
}

//params required: 
app.get("/invite-email-mailto", (req, res) =>{
  const {first_name, last_name, email} = req.body;
  res.send(createInviteEmail(first_name, last_name, email));
});

//shouldn't need the user_id once tokens become available
const createInviteEmail = async (first_name, last_name, email, user_id) => {

  let code = await generateReferalCode();

  var subject = "Invitation to Field Goal Finance";
  var body = "Hello " + first_name + " " + last_name + "! Do you have what it takes to outperform your peers? You have been cordially \
  invited to a unique and exclusive gaming community!\
  \
  Click here to download the Field Goal Finance app, or go the Apple Store or Andriod Market and download \"FGF\". \
  Your invitation code is " + code + ".\
  \
  As someone who works in the financial services industry you will have the opportunity to compete against your peers for bragging rights \
  plus a chance to win a prize!\
  \
  Click the following link to learn more about the game: [INSERT STATIC FAQ PAGE LINK]\
  \
  Thank you for playing!";
  var mailtoLink = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

  //insert the invite to the Referrals table in the database
  //NOTE: The referrer ID will be dummy data for now, delete once auth tokens are set up
  const referralInsertQuery = 'INSERT INTO Referrals (referrer_id, referred_email, referral_code, status, expiration_date) VALUES (?, ?, ?, ?, ?)';
  const expiration_date = new Date();
  expiration_date.setDate(expiration_date.getDate() + 7); // Set the expiration date to 7 days from the current date
  const referralInsertQueryAsync = util.promisify(db.query).bind(db);
  await referralInsertQueryAsync(referralInsertQuery, [user_id, email, code, 'pending', expiration_date]);

  res.send(mailtoLink);
};



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

    // // Insert the referral information
    // const referralInsertQuery = 'INSERT INTO Referrals (referrer_id, referred_email, referral_code, status, expiration_date) VALUES (?, ?, ?, ?, ?)';
    // const expiration_date = new Date();
    // expiration_date.setDate(expiration_date.getDate() + 7); // Set the expiration date to 7 days from the current date
    // const referralInsertQueryAsync = util.promisify(db.query).bind(db);
    // await referralInsertQueryAsync(referralInsertQuery, [referrer_id, email, referral_code, 'pending', expiration_date]);

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

  // Buy/sell test functions
  // await(buyStockByShare(4, 112, 1));
  // await(sellStockByShare(4, 112, 1));
  // await(buyStockByCashAmount(4, 112, 300));
  // await(sellStockByCashAmount(4, 112, 203));
  // console.log(await(fetchStockCount(4)));

  // console.log(await(fetchLastSave(4)));
  // console.log(await(validateSave(4)));

  // console.log(await(fetchPortfolioValues(4)));

  const portfolioId = 5; // Replace with the actual portfolio ID
  const actions = [
    { type: 'buyShare', stockId: 112, quantity: 0 },

    { type: 'sellShare', stockId: 113, quantity: 0 }
  ];

  /*
  console.log(await(processActions(portfolioId, actions)
    .then((cashBalance) => {
      console.log("Final cash balance:", cashBalance);
      // Handle successful execution
    })
    .catch((error) => {
      console.error("Error:", error.message);
      // Handle error
    })));
    */

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
          const date = '2023-07-18'; // specify the date for which you want to fetch the market data
  
          try {
            const response = await axios.get(`https://api.polygon.io/v1/open-close/${symbol}/${date}?apiKey=${config.polygonPrice}`);
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

// app.listen(3001, () => {
//   console.log("local host server running")
// });

main();

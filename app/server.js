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
const cron = require('node-cron');
const jwt = require("jsonwebtoken");

const SECRET_KEY = config.SECRET_KEY;

let inviteAdvisorRoutes = require('./routes/inviteRoutes');
let signInRoutes = require('./routes/signInRoutes');
let signUpRoutes = require('./routes/signUpRoutes');
let homepageRoutes = require('./routes/homepageRoutes');
let logoutRoutes = require('./routes/logoutRoutes');

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
	password: config.localhost_password,
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

/* app.post('/faq/add', (req, res) => {
	try {
	const question = req.body.question;
	const answer = req.body.answer;
	var sql = 'INSERT INTO faq (question, answer, date_created) VALUES (?,?,now())';
	const values = [question, answer];
	const sqlAsync = util.promisify(db.query).bind(db);
	await sqlAsync(sql, [username,phone_number,hashedPassword,userId]);
	} catch (error) {
		res.send({ err: error.message });
	}
}); */

// Function to fetch stock info for a given symbol from an external API (Polygon)
const getStockInfo = async (symbol) => {
  try {
    const response = await axios.get(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${config.polygonInfo}`);
    const data = response.data;
    return {
      symbol: symbol,
      description: data.results.description,
      name: data.results.name
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

// Function to insert stock info into MySQL database
const insertStock = async (stock) => {
  const sql = 'INSERT INTO Stocks (ticker, description, stock_name) VALUES (?, ?, ?)';
  const values = [stock.symbol, stock.description, stock.name];
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


//Function to compare two action objects
const compareActions = async (obj, actions, min_stocks, max_stocks) => {
  for (const stockId in obj) {
    if (actions.hasOwnProperty(stockId)) {
        obj[stockId] += actions[stockId];
        if (obj[stockId] == 0) {
          delete obj[stockId];
        }
    }
  }
  if (JSON.stringify(obj) === '{}') {
  return false;
  } else if (Object.keys(obj).length < min_stocks || Object.keys(obj).length > max_stocks) {
    return false;
  } else {
    console.log(obj)
    return true;
  }
};


// Function to validate if portfolio changes can be saved
const validateSave = async (portfolioId, actions, startingObj) => {
  const lastSave = await(fetchLastSave(portfolioId));
  const currDate = new Date();
  currDate.setHours(0,0,0,0);
  console.log(lastSave);
  console.log(currDate);

  const { game_id, game_name, starting_cash, start_date, end_date, min_stocks, max_stocks, last_update } = await fetchGameInfoForPortfolio(portfolioId);
  
  console.log('shit we got back');
  console.log(game_id);
  console.log(game_name);


  let lastSaveCheck = false;
  let numStockCheck = false;
  let balanceCheck = false;

  // check if portfolio has been saved today
  if (lastSave >= currDate) {
    console.log("You have already made changes to your portfolio today. These changes will not be saved.");
    lastSaveCheck = false;
  } else {
    lastSaveCheck = true;
  }
  
  // check num of unique stocks
  const numStocks = await(fetchStockCount(portfolioId));
  if (numStocks < min_stocks || numStocks > max_stocks) {
    console.log('Must have between ' + min_stocks + ' and ' + max_stocks + ' different stocks.');
    numStockCheck = await compareActions(startingObj, actions, min_stocks, max_stocks);
  } else {
    numStockCheck = await compareActions(startingObj, actions, min_stocks, max_stocks);
  }
  
  // check non-negative final cash balance (assuming a valid list of transactions is given)
  const final_cash_balance = await(processActions(portfolioId, actions));
  if (final_cash_balance < 0) {
    console.log("Cannot have a negative cash balance.")
    balanceCheck = false;
  } else {
    balanceCheck = true;
  }

  if (lastSaveCheck && numStockCheck && balanceCheck) {
    return true;
  } else if (lastSaveCheck === false) {
    return "You have already made changes to your portfolio today. These changes will not be saved."
  } else if (numStockCheck === false) {
    return 'Must have between ' + min_stocks + ' and ' + max_stocks + ' different stocks.';
  } else if (balanceCheck === false) {
    return "Cannot have a negative cash balance."
  } else {
    return "Failed to update portfolio."
  }
}

// Function to see portfolio value results after a list of transactions [id1: -2, id2: 2]
const processActions = async (portfolioId, actions) => {
	try {
		const { cash_value, asset_value, portfolio_value } = await fetchPortfolioValues(portfolioId);
		let cashBalance = parseFloat(cash_value, 2);
		console.log(actions);
		console.log(`Cash balance: ${cashBalance}`);

		for (const stock_id in actions) {
			const stockPrice = await fetchStockPrice(stock_id);
			console.log(stockPrice);
			console.log(actions[stock_id]);
			cashBalance -= stockPrice * actions[stock_id], 2;
		}
		cashBalance = cashBalance.toFixed(2);
		console.log(cashBalance);

		return cashBalance;
	} catch (error) {
		throw error;
	}
};

// Function to see portfolio value results after a list of transactions [ticker1: -2, ticker2: 2]
const processActionsTicker = async (portfolioId, actions) => {
	try {
		const { cash_value, asset_value, portfolio_value } = await fetchPortfolioValues(portfolioId);
		let cashBalance = parseFloat(cash_value, 2);
		console.log(actions);
		console.log(`Cash balance: ${cashBalance}`);

		for (const ticker in actions) {
			const stockPrice = await fetchStockPriceByTicker(ticker);
			console.log(stockPrice);
			console.log(actions[ticker]);
			cashBalance -= stockPrice * actions[ticker], 2;
		}
		cashBalance = cashBalance.toFixed(2);
		console.log(cashBalance);

		return cashBalance;
	} catch (error) {
		throw error;
	}
};

//Function to update last save
const updateLastSave = async (portfolioId) => {
  const sql = 'UPDATE Portfolios SET last_save = NOW() WHERE portfolio_id = ?';
  const values = [portfolioId];
  const query = util.promisify(db.query).bind(db);

  try {
    const results = await query(sql, values);
    return results;
  } catch (error) {
    throw error;
  }
}

//Function to save buy and sell of stock from a list of transactions to db after successful validation
const saveBuyAndSellStock = async (portfolioId, actions) => {
  try {
    for (const stockId in actions) {
      if (actions[stockId] > 0) {
        await buyStockByShare(portfolioId, stockId, actions[stockId]);
      } else if (actions[stockId] < 0) {
        await sellStockByShare(portfolioId, stockId, -actions[stockId]);
      } else {
        return 0;
      }
    }
    await updateLastSave(portfolioId);
  } catch (error) {
    throw error;
  }
};

app.post('/update-portfolio', async (req, res) => {
  try {
    console.log('hit here');
    const updatedPortfolioData = req.body;
    const portfolioId = updatedPortfolioData.portfolioId;
    const actions = updatedPortfolioData.actions;
    const startingObj = updatedPortfolioData.startingStocksObj;
    if (JSON.stringify(actions) === '{}') {
      res.send("No action performed");
    } else {
      const validate = await validateSave(portfolioId,actions, startingObj);
      if (validate === true) {
        res.send("Validation passed");
        await saveBuyAndSellStock(portfolioId,actions);
      } else {
        console.log('delete - validation did not pass');
        res.send(validate);
      }
    }
  } catch (error) {
    throw error;
  }
});




//Function to populate actions list
const addAction = async (stock_id, quantity, actions) => {
	try {
		actions[stock_id] += quantity;
		return actions;
	} catch (error) {
		throw error;
	}
};

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
		const cashBalance = parseFloat(cash_value,2);
		const assetValue = parseFloat(asset_value,2);
		const portfolioValue = parseFloat(portfolio_value,2);

		console.log(`Original cash balance: ${cashBalance}`);

		const stockPrice = await fetchStockPrice(stockId);
		const totalCost = stockPrice * quantity;

    if (portfolioValue >= totalCost) {
      const newCashBalance = cashBalance - totalCost;
      const newAssetValue = assetValue + totalCost;
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

const fetchPortfolioStocks = async (portfolioId) => {
  const sql = 'SELECT * FROM PortfolioStock p JOIN Stocks s on s.stock_id = p.stock_id JOIN StockHistory sh on sh.stock_id = s.stock_id WHERE portfolio_id = ?'
  const values = [portfolioId];
  const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results;
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

// Function to fetch stock price by Id (based on opening price)
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

// Function to fetch stock price by ticker(based on opening price)
const fetchStockPriceByTicker = (ticker) => {
	const sql = 'SELECT sh.open FROM StockHistory sh JOIN Stocks s ON sh.stock_id = s.stock_id WHERE s.ticker = ?';
	const values = [ticker];
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
	const sql = 'SELECT shares FROM PortfolioStock WHERE portfolio_id = ? AND stock_id = ?';
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

// Function to fetch number of unique stocks in portfolio
const fetchStockCount = (portfolioId) => {
	const sql = 'SELECT COUNT(*) as count FROM PortfolioStock WHERE portfolio_id = ?';
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
		const sql = `UPDATE PortfolioStock SET shares = ? WHERE portfolio_id = ? AND stock_id = ?`;
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
		const sql = `INSERT INTO PortfolioStock (portfolio_id, stock_id, shares) VALUES (?, ?, ?)`;
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
	const sql = `SELECT * FROM PortfolioStock WHERE portfolio_id = ? AND stock_id = ?`;
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
	const sql = 'UPDATE Portfolios SET yesterday_value = portfolio_value';
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

// Function to fetch user's past portfolios in order of most recent game end date
const fetchPastPortfolios = (userId) => {
	const sql = 'SELECT * FROM Portfolios p JOIN GameInfo g ON p.game_id = g.game_id WHERE p.user_id = ? ORDER BY g.end_date DESC;';
	const values = [userId];
	return new Promise((resolve, reject) => {
		db.query(sql, values, (error, results, fields) => {
			if (error) {
				reject(error);
			} else {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			}
		});
	});
};

const fetchGameInfoForPortfolio = async (portfolioId) => {
  const sql = 'SELECT * FROM GameInfo g JOIN Portfolios p on p.game_id = g.game_id WHERE portfolio_id = ?;';
  const values = [portfolioId];
  const query = util.promisify(db.query).bind(db);

  try {
    const results = await query(sql, values);
    return results[0];
  } catch (error) {
    throw error;
  }
};


// Function to fetch all portfolios in a game in order of highest portfolio value
const fetchGamePortfolios = (gameId) => {
	const sql = 'SELECT * FROM Portfolios WHERE game_id = ? ORDER BY portfolio_value DESC';
	const values = [gameId];
	return new Promise((resolve, reject) => {
		db.query(sql, values, (error, results, fields) => {
			if (error) {
				reject(error);
			} else {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			}
		});
	});
};


// Function to fetch current portfolio
const fetchCurrentPortfolioId = async (userId) => {
  const sql = 'SELECT p.portfolio_id FROM Portfolios p JOIN Users u ON p.game_id = u.current_game WHERE p.user_id = ?';
  const values = [userId];
  const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results[0].portfolio_id;
	} catch (error) {
		throw error;
	}
};

// Function to fetch all users in a game in order of highest portfolio value
const fetchGameUsers = (gameId) => {
	const sql = 'SELECT u.username, p.portfolio_value, g.game_id FROM Users u JOIN Portfolios p ON u.user_id = p.user_id JOIN GameInfo g ON p.game_id = g.game_id WHERE g.game_id = ? ORDER BY p.portfolio_value DESC';
	const values = [gameId];
	return new Promise((resolve, reject) => {
		db.query(sql, values, (error, results, fields) => {
			if (error) {
				reject(error);
			} else {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			}
		});
	});
};

const fetchUserInfo = async (userId) => {
	const sql = 'SELECT first_name, last_name, username FROM Users WHERE user_id = ?';
	const values = [userId];
	const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results[0];
	} catch (error) {
		throw error;
	}
};

//Function to calculate day delta
const fetchDayDelta = async (userId) => {
  const sql = 'SELECT (portfolio_value - yesterday_value) FROM Portfolios WHERE game_id = (SELECT current_game FROM Users WHERE user_id = ?) and user_id = ?';
  const values = [userId,userId];
  const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results[0];
	} catch (error) {
		throw error;
	}
};

//Function to calculate week delta
const fetchWeekDelta = async (userId) => {
  const sql = 'SELECT (portfolio_value - last_week_value) FROM Portfolios WHERE game_id = (SELECT current_game FROM Users WHERE user_id = ?) and user_id = ?';
  const values = [userId,userId];
  const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results[0];
	} catch (error) {
		throw error;
	}
};

/* app.post('/signin', async (req, res) => {
	const { email, password } = req.body;

	// Inside the '/signin' route
try {
	const [rows] = await runQuery('SELECT * FROM Users WHERE email = ?', [email]);

	if (!rows || rows.length === 0) {
		return res.status(401).json({ error: 'Invalid email or password' });
	}

	const user = rows[0];

	// Compare passwords
	const passwordMatch = bcrypt.compareSync(password, user.password);

	if (!passwordMatch) {
		return res.status(401).json({ error: 'Invalid email or password' });
	}

	// Generate JWT token
	const token = jwt.sign({ userId: user.user_id }, config.SECRET_KEY, { expiresIn: '1h' });

	res.json({ token });
} catch (error) {
	console.error('Error signing in:', error);
	res.status(500).json({ error: 'An error occurred while signing in' });
}

});
 */


// Route for getting user's homepage
/* app.get('/homepage/:userId', async (req, res) => {
	try {
		const userId = req.params.userId;
		const user = await fetchUserInfo(userId);
		const currGameUsers = await fetchCurrentGameUsers(userId);
		const pastGames = await fetchPastGames(userId);
		const dayDelta = await fetchDayDelta(userId);
		const weekDelta = await fetchWeekDelta (userId);
		const avgRank = await fetchAveRanking(userId);
		const no1stRank = await fetchNumber1stRankedGames(userId);
		const no2ndRank = await fetchNumber2ndRankedGames(userId);
		const no3rdRank = await fetchNumber3rdRankedGames(userId);

		const data = { user, currGameUsers, pastGames, avgRank, no1stRank, no2ndRank, no3rdRank};

		if (user) {
			res.json(data);
			console.log("sending homepage data");
		} else {
			res.send({ message: "Account does not exist" });
		}
	} catch (error) {
		res.send({ err: error.message });
	}
}); */


app.get('/portfolio', async (req, res) => {
	try {
		const token = req.headers.authorization.split(' ')[1];
		console.log('Token:', token); // Debugging
		const userId = await getUserIdFromToken(token);
		// Fetch user data from the database based on userId
		const user = await getUserById(userId);
		console.log('User ID:', user); // Debugging

		const portfolioId = await fetchCurrentPortfolioId(userId);
		console.log('Portfolio ID:', portfolioId); // Debugging

		const portfolioValues = await fetchPortfolioValues(portfolioId);
		const stocks = await fetchPortfolioStocks(portfolioId);

    const data = { portfolioValues, stocks, portfolioId };
    console.log(data);

		if (portfolioId) {
			res.json(data);
		} else {
			res.send({ message: "Portfolio does not exist" });
		}
	} catch (error) {
		res.send({ err: error.message });
	}
});



// Main function to fetch stock info for multiple symbols and insert into database using Polygon API
const main = async () => {

	// Schedule task to record end of day portfolio values
	var task = cron.schedule('0 17 * * *', async () => {
		const sql = `UPDATE Portfolios SET yesterday_value = portfolio_value`;
		try {
			const results = await new Promise((resolve, reject) => {
				db.query(sql, (error, results, fields) => {
					if (error) {
						reject(error);
					} else {
						resolve(results);
					}
				});
			});
			console.log(results);
		} catch (error) {
			console.error(error);
		}
	});
			
	task.start();


  //console.log(await(fetchCurrentPortfolioId(2)));
  //console.log(await(fetchPortfolioStocks(7)));
  console.log(await(getStockInfo("AAPL")));


	// console.log(await(fetchUserInfo(2)));
	// console.log(await(fetchPastGames(2)));

	
	// const symbols = ['AAPL', 'GOOG', 'AMZN']; // add more symbols here

	// Buy/sell test functions
	// await(buyStockByShare(7, 112, 2));
	//await(buyStockByShare(7, 113, 2));
	// await(buyStockByShare(7, 115, 2));
	// await(sellStockByShare(4, 112, 1));
	// await(buyStockByCashAmount(4, 112, 300));
	// await(sellStockByCashAmount(4, 112, 203));
	// console.log(await(fetchStockCount(4)));

	// console.log(await(fetchLastSave(4)));
	// console.log(await(validateSave(4)));

	// console.log(await(fetchPortfolioValues(7)));
	// console.log(await(fetchPortfolioStocks(7)));

	// console.log(await(fetchPastPortfolios(1)));
	// console.log(await(fetchGameInfoForPortfolio(1)));
	// console.log(await(fetchGamePortfolios(1)));
	// console.log(await(fetchGameUsers(1)));
	const actions = {
		112: -6,
		113: -4,
		115: 200
	};

	const actionsTicker = {
		"MMM": -6,
		"AOS": -4,
		"ABBV": 200
	};
	//console.log(await(processActions(7, actions)));
	//console.log(await(processActionsTicker(7, actionsTicker)));
	// console.log(await(fetchCurrentGameUsers(2)));


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
					const currentDate = new Date();
					const formattedDate = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
					const date = "2023-08-10"; // specify the date for which you want to fetch the market data
	
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

//
// new updated code!!! NEW STRUCTURE!
//

app.use('/', inviteAdvisorRoutes);
app.use('/', signInRoutes);
app.use('/', signUpRoutes);
app.use('/', homepageRoutes);
app.use('/', logoutRoutes);

//error handling middleware
app.use((error, req, res, next) => {
	//sends the status code or 500 if no status code was given
	res.status(error.status || 500).json({ message: error.message });
});

app.listen(3001, () => {
	console.log("local host server running")
});

main();
let mysql = require("mysql2");
let config = require('../../config.json');
const util = require('util');

let db = mysql.createConnection({
	user: "root",
	host: "localhost",
	password: config.localhost_password,
	database: config.db_name,
	insecureAuth: true
});

let runQuery = (query, params) => {
	return new Promise((resolve, reject) => {
		db.query(query, params, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
}
exports.runQuery = runQuery;

// Define the function to get user data by ID
let getUserById = async (userId) => {
	try {
		const [rows] = await db.promise().execute('SELECT * FROM Users WHERE user_id = ?', [userId]);
		if (rows && rows.length > 0) {
			return rows[0];
		}
		return null; // No user found
	} catch (error) {
		console.error('Error fetching user data by ID:', error);
		throw error;
	}
};
exports.getUserById = getUserById;

// Function to fetch current game users in order of highest portfolio value
let fetchCurrentGameUsers = async (userId) => {
	try {
		const currGame = await fetchCurrentGame(userId);
		const currGameUsers = await(fetchGameUsers(currGame));
		return currGameUsers;
	} catch (error) {
		throw error;
	}
};
exports.fetchCurrentGameUsers = fetchCurrentGameUsers;

// Function to fetch current game
let fetchCurrentGame = async (userId) => {
	const sql = 'SELECT current_game FROM Users WHERE user_id = ?';
	const values = [userId];
	const query = util.promisify(db.query).bind(db);
  
	try {
		const results = await query(sql, values);
		return results[0].current_game;
	} catch (error) {
		throw error;
	}
};
exports.fetchCurrentGame = fetchCurrentGame;

// Function to fetch user's past games in order of most recent game end date
let fetchPastGames = (userId) => {
	const sql = 'SELECT g.game_name, g.sponsor, g.type FROM Portfolios p JOIN GameInfo g ON p.game_id = g.game_id WHERE p.user_id = ? AND p.game_id != (SELECT current_game FROM Users WHERE user_id = ?) ORDER BY g.end_date DESC;';
	const values = [userId, userId];
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
}
exports.fetchPastGames = fetchPastGames;

//Function to calculate average rank
let fetchAveRanking =  async (userId) => {
	const sql = 'SELECT AVG(ranking) FROM (SELECT user_id, game_id, portfolio_value, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY portfolio_value DESC) ranking FROM Portfolios ORDER BY game_id) ranking_table WHERE user_id = ?';
	const values = [userId];
	const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results[0];
	} catch (error) {
		throw error;
	} 
};
exports.fetchAveRanking = fetchAveRanking;

//Function to calculate # of 1st rank games
let fetchNumber1stRankedGames =  async (userId) => {
	const sql = 'SELECT COUNT(ranking) FROM (SELECT user_id, game_id, portfolio_value, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY portfolio_value DESC) ranking FROM Portfolios ORDER BY game_id) ranking_table WHERE ranking = ? AND user_id = ?';
	const values = [1, userId];
	const query = util.promisify(db.query).bind(db);
  
	try {
		const results = await query(sql, values);
		return results[0];
	} catch (error) {
		throw error;
	} 
};
exports.fetchNumber1stRankedGames = fetchNumber1stRankedGames;

//Function to calculate # of 2nd rank games
let fetchNumber2ndRankedGames =  async (userId) => {
	const sql = 'SELECT COUNT(ranking) FROM (SELECT user_id, game_id, portfolio_value, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY portfolio_value DESC) ranking FROM Portfolios ORDER BY game_id) ranking_table WHERE ranking = ? AND user_id = ?';
	const values = [2, userId];
	const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results[0];
	} catch (error) {
		throw error;
	} 
};
exports.fetchNumber2ndRankedGames = fetchNumber2ndRankedGames;

//Function to calculate # of 3rd rank games
let fetchNumber3rdRankedGames =  async (userId) => {
	const sql = 'SELECT COUNT(ranking) FROM (SELECT user_id, game_id, portfolio_value, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY portfolio_value DESC) ranking FROM Portfolios ORDER BY game_id) ranking_table WHERE ranking = ? AND user_id = ?';
	const values = [3, userId];
	const query = util.promisify(db.query).bind(db);

	try {
		const results = await query(sql, values);
		return results[0];
	} catch (error) {
		throw error;
	} 
};
exports.fetchNumber3rdRankedGames = fetchNumber3rdRankedGames

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
exports.fetchGameUsers = fetchGameUsers;

let fetchUserInfo = async (userId) => {
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
exports.fetchUserInfo = fetchUserInfo;

//Function to calculate day delta
let fetchDayDelta = async (userId) => {
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
exports.fetchDayDelta = fetchDayDelta;

//Function to calculate week delta
let fetchWeekDelta = async (userId) => {
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
exports.fetchWeekDelta = fetchWeekDelta;

// Function to fetch all portfolios in a game in order of highest portfolio value
let fetchGamePortfolios = (gameId) => {
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
exports.fetchGamePortfolios = fetchGamePortfolios;

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
exports.fetchCurrentPortfolioId = fetchCurrentPortfolioId;

let fetchPortfolioValues = async (portfolioId) => {
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
exports.fetchPortfolioValues = fetchPortfolioValues;

let fetchPortfolioStocks = async (portfolioId) => {
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
exports.fetchPortfolioStocks = fetchPortfolioStocks;

let insertReferral = async (user_id, email, code) => {
	const referralInsertQuery = 'INSERT INTO Referrals (referrer_id, referred_email, referral_code, status, expiration_date) VALUES (?, ?, ?, ?, ?)';
	const expiration_date = new Date();
	expiration_date.setDate(expiration_date.getDate() + 7); // Set the expiration date to 7 days from the current date
	const referralInsertQueryAsync = util.promisify(db.query).bind(db);
	await referralInsertQueryAsync(referralInsertQuery, [user_id, email, code, 'pending', expiration_date]);
}
exports.insertReferral = insertReferral;
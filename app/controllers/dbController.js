let mysql = require("mysql2");
let config = require('../../config.json');

let db = mysql.createConnection({
	user: "root",
	host: "localhost",
	password: config.localhost_password,
	database: config.db_name,
	insecureAuth: true
});

exports.runQuery = (query, params) => {
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

// Define the function to get user data by ID
exports.getUserById = async (userId) => {
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

// Function to fetch current game users in order of highest portfolio value
exports.fetchCurrentGameUsers = async (userId) => {
	try {
		const currGame = await(fetchCurrentGame(userId));
		const currGameUsers = await(fetchGameUsers(currGame));
		return currGameUsers;
	} catch (error) {
		throw error;
	}
};

// Function to fetch user's past games in order of most recent game end date
exports.fetchPastGames = (userId) => {
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

//Function to calculate average rank
exports.fetchAveRanking =  async (userId) => {
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

//Function to calculate # of 1st rank games
exports.fetchNumber1stRankedGames =  async (userId) => {
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

//Function to calculate # of 2nd rank games
exports.fetchNumber2ndRankedGames =  async (userId) => {
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

//Function to calculate # of 3rd rank games
exports.fetchNumber3rdRankedGames =  async (userId) => {
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
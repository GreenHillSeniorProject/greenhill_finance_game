const express = require('express');
const router = express.Router();
let util = require('util');
let dbCTLR = require('../controllers/dbController');
let db = dbCTLR.db;
let jwtCTLR = require('../controllers/tokenController');

//bracket notation [] only used because of the dash in the route
let invite_mailto = async (req, res) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  let inviterToken = authHeader.split(' ')[1]; // Extract the token part

  const {first_name, last_name, email} = req.body;
  console.log("email:", email);
  
  let mailto = await createInviteEmail(first_name, last_name, email, inviterToken);
  console.log("successful mailto created");
  res.send(mailto);
};

//shouldn't need the user_id once tokens become available
const createInviteEmail = async (first_name, last_name, email, token) => {
  let code = generateReferralCode();
  let user_id = jwtCTLR.getIdFromToken(token).userId;
  console.log("user_id: ", user_id);
  console.log("email: ", email);
  console.log("first name: ", first_name);
  console.log("last name: ", last_name);
  var subject = "Invitation to Field Goal Finance";
  var body = "Hello " + first_name + " " + last_name + "!\n\nDo you have what it takes to outperform your peers? You have been cordially \
invited to a unique and exclusive gaming community!\n\n\
\
Click here to download the Field Goal Finance app, or go the Apple Store or Andriod Market and download \"FGF\". \
Your invitation code is " + code + ".\n\n\
\
As someone who works in the financial services industry you will have the opportunity to compete against your peers for bragging rights \
plus a chance to win a prize!\n\n\
\
Click the following link to learn more about the game: [INSERT STATIC FAQ PAGE LINK]\n\n\
\
Thank you for playing!";
  var mailtoLink = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

  //insert the invite to the Referrals table in the database
  //NOTE: The referrer ID will be dummy data for now, delete once auth tokens are set up
  console.log("made it to query")
  const referralInsertQuery = 'INSERT INTO Referrals (referrer_id, referred_email, referral_code, status, expiration_date) VALUES (?, ?, ?, ?, ?)';
  const expiration_date = new Date();
  expiration_date.setDate(expiration_date.getDate() + 7); // Set the expiration date to 7 days from the current date
  const referralInsertQueryAsync = util.promisify(db.query).bind(db);
  await referralInsertQueryAsync(referralInsertQuery, [user_id, email, code, 'pending', expiration_date]);


  return mailtoLink;
};

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

router.post('/invite-mailto', invite_mailto);

module.exports = router;
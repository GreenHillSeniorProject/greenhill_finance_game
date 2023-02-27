const mysql = require("mysql");
const config = require("../config.json");

const db = mysql.createConnection({
    host: "database-1.cpjwwrmrh8mc.us-east-1.rds.amazonaws.com",
    port: "3306",
    user: config.user,
    password: config.password,
    databse: ""
});

db.connect((err)=>{
    if(err){
        console.log("Ran into an error");
    }
    console.log("successful connection");
})
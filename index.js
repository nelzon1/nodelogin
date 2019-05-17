var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const jsonfile = require("jsonfile");
const bcrypt = require("bcrypt");


const credentials = jsonfile.readFileSync('dbinfo.ini');
var connection = mysql.createConnection({
    host: credentials.host,
    user: credentials.user,
    password: credentials.password,
    database: credentials.database,
    port: credentials.port
})

var app = express();

app.use(session({
    secret: credentials.secret,
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get('/', function(request,response) {
    response.sendFile(path.join(__dirname + '/login.htm'));
});

app.get('/register', function(request,response) {
    response.sendFile(path.join(__dirname + '/signup.htm'));
});

app.post("/auth", function(request,response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query("SELECT password FROM accounts WHERE username = ?", [username], function(error, results, fields) {
            if (error) {
                throw error;
            }
            if (results.length > 0) {
                bcrypt.compare(password,results[0].password,function(err,res){
                    if(res){
                        request.session.loggedin = true;
                        request.session.username = username;
                        response.redirect('/home');
                    }
                    else {
                        response.send('Incorrect Username and/or Password.');
                    }
                    response.end();
                });                
            }        
        });
    }
    else {
        respsonse.send("Please enter Username and Password.");
        response.end();
    }
})

app.post("/signup", function(request,response) {
    var username = request.body.username;
    var password = request.body.password;
    var email = request.body.email;
    if (username && password) {
        bcrypt.hash(password,10, function(err,hash){
            if (err) {
                throw err;
            }
            connection.query("INSERT INTO accounts(username,password,email) VALUES(?,?,?);", [username,hash,email], function(error, results, fields) {
                if (error) {
                    throw error;
                }
                if (results.affectedRows > 0) {
                    request.session.loggedin = true;
                    request.session.username = username;
                    response.redirect('/home');
                }
                else {
                    response.send('Username or email already exists');
                }
                response.end();
            });
        });
    }
    else {
        respsonse.send("Please enter Username and Password.");
        response.end();
    }
})

app.get('/home', function(request,response){
    if (request.session.loggedin) {
        response.send("Welcome back, " + request.session.username + "!");
    }
    else {
        response.send("Please login to view this page.");
    }
    response.end();
});

var server = app.listen(7410, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
 })
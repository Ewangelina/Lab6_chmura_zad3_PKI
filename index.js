const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')
const axios = require('axios')
const { Client } = require("pg")
const dotenv = require("dotenv")
dotenv.config()
const postgres = require('postgres')


const app = express()
//https://lab6-zad3.onrender.com/auth/google/callback
const CLIENT_ID = OAuth2Data.web.client_id; 
const CLIENT_SECRET = OAuth2Data.web.client_secret; 
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
let authed = false;
let username = "";
var oauth2;

const clientID = "189a8fb8aff66b200a36";
const clientSecret = "84ea18cd3fe49b8ea62f7417747c5a189359454a";
let client;

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require?options=project%3D${ENDPOINT_ID}`;
const sql = postgres(URL, { ssl: 'require' });
app.set('view engine', 'ejs');
var access_token = "";

app.get('/auth/github/callback', (req, res) => {

    // The req.query object has the query params that were sent to this route.
    const requestToken = req.query.code
    
    axios({
      method: 'post',
      url: `https://github.com/login/oauth/access_token?client_id=${clientID}&client_secret=${clientSecret}&code=${requestToken}`,
      // Set the content type header, so that we get the response in JSON
      headers: {
           accept: 'application/json'
      }
    }).then((response) => {
      access_token = response.data.access_token;
      username = response.data.username;
      res.redirect('/success');
    })
  })
  
  app.get('/success', function(req, res) { //Github success
    let ret = "";
        ret += `<!DOCTYPE html>`;
        ret += `<html lang="en">`;
        ret += `<head>`;
        ret += `    <meta charset="utf-8">`;
        ret += `    <meta name="viewport" content="width=device-width, initial-scale=1">`;
        ret += `    <title>` + username + `</title>`;
        ret += `    <!-- Bootstrap CSS -->`;
        ret += `    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">`;
        ret += `</head>`;
        ret += `<body>`;
        ret += `    <!-- Bootstrap JS Bundle with Popper -->`;
        ret += `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>`;
        ret += `    <div class="container">`;
        ret += `        <h1>Logged in through Github</h1>`;
        ret += `        <p>` + username + `</p>`;
        ret += `    </div>`;
        ret += `<a href="https://lab6-zad3.onrender.com/" >HOMEPAGE</a>`;

        ret.send(ret);
  });

app.get('/', (req, res) => {
    let ret = "";
    ret += `<!DOCTYPE html>`;
    ret += `<html lang="en">`;
    ret += `<head>`;
    ret += `    <meta charset="utf-8">`;
    ret += `    <meta name="viewport" content="width=device-width, initial-scale=1">`;
    if (username != undefined && username != "")
    {
        ret += `    <title>` + username + `</title>`;
    }
    else
    {
        ret += `    <title>Not logged in</title>`;
    }
    
    ret += `    <!-- Bootstrap CSS -->`;
    ret += `    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">`;
    ret += `</head>`;
    ret += `<body>`;
    ret += `    <!-- Bootstrap JS Bundle with Popper -->`;
    ret += `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>`;

    if (authed)
    {
        oauth2 = google.oauth2({auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.v2.me.get(function(err, result) {
            if (err) return console.log('Returned an error: ' + err);
            else
            {
                username = result.data.name;
            }
        });

        ret += `    <div class="container">`;
        ret += `        <h1>Logged in through Google</h1>`;
        ret += `        <p>` + username + `</p>`;
        ret += `    </div>`;
    }
    ret += `<a href="https://lab6-zad3.onrender.com/google" target="_blank">Sign in with Google</a>`;
    ret += `<br>`;
    ret += `<a href="https://github.com/login/oauth/authorize?client_id=189a8fb8aff66b200a36" target="_blank">Sign in with Github</a>`;
    ret += `<br>`;
    ret += `<a href="https://lab6-zad3.onrender.com/googleout" target="_blank">Sign OUT from Google</a>`;
    ret += `<br>`;
    ret += `<a href="https://lab6-zad3.onrender.com/db" target="_blank">DATABASE</a>`;
    res.send(ret)
});

app.get('/googleout', (req, res) => {
  authed = false;
  try
  {
      var auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(function () {
          console.log('User signed out.');
          res.send(`User signed out<br><a href="https://lab6-zad3.onrender.com">Homepage</a>`);
      });
  }
  catch (err)
  {
    username = "";
    res.send("Logged out");
  }    
  
  
});

app.get('/google', (req, res) => {
    if (!authed) {
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        //console.log(url)
        res.redirect(url);
    } else {
        oauth2 = google.oauth2({auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.v2.me.get(function(err, result) {
            if (err) return console.log('Returned an error: ' + err);
            else
            {
                username = result.data.name;
            }
        });

        let ret = "";
        ret += `<!DOCTYPE html>`;
        ret += `<html lang="en">`;
        ret += `<head>`;
        ret += `    <meta charset="utf-8">`;
        ret += `    <meta name="viewport" content="width=device-width, initial-scale=1">`;
        ret += `    <title>` + username + `</title>`;
        ret += `    <!-- Bootstrap CSS -->`;
        ret += `    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">`;
        ret += `</head>`;
        ret += `<body>`;
        ret += `    <!-- Bootstrap JS Bundle with Popper -->`;
        ret += `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>`;
        ret += `    <div class="container">`;
        ret += `        <h1>Logged in with Google</h1>`;
        ret += `        <p>` + username + `</p>`;
        ret += `    </div>`;
        ret += `<a href="https://lab6-zad3.onrender.com/" >HOMEPAGE</a>`;

        ret.send(ret);       
    }
})

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/google')
            }
        });
    }
});

app.get('/db', function (req, res) {
    connectDb();
    console.log("Pobieranie danych");
    let ret = "Check logs";
    ret += `<table class="table">`;
    ret += `    <thead>`;
    ret += `        <tr>`;
    ret += `            <th>ID</th>`;
    ret += `            <th>Name</th>`;
    ret += `            <th>Joined</th>`;
    ret += `            <th>Last visit</th>`;
    ret += `            <th>Counter</th>`;
    ret += `        </tr>`;
    ret += `    </thead>`;
    ret += `    <tbody>`;
    client.query('SELECT * FROM users', (error, res) => {
        if (error) {
            console.log(error);
            ret = "ERROR in connecting to database";
            return;
        }
        console.log("Odebrane dane");
        for (let row of res.rows){
            ret = "Always " + ret;
            let json_row = JSON.stringify(row);
            ret += `        <tr>`;
            ret += `            <td>` + json_row.id.toString() + `</td>`;
            ret += `            <td>` + json_row.name.toString() + `</td>`;
            ret += `            <td>` + json_row.joined.toString() + `</td>`;
            ret += `            <td>` + json_row.lastvisit.toString() + `</td>`;
            ret += `            <td>` + json_row.counter.toString() + `</td>`;
            ret += `        </tr>`;
            console.log(JSON.stringify(row));
        }
    })
    ret += `    </tbody>`;
    ret += `</table>`;

    disconnectDB();
    res.send(ret);
});

const connectDb = async () => {
     try {
       client = new Client({
       user: process.env.PGUSER,
       host: process.env.PGHOST,
       database: process.env.PGDATABASE,
       password: process.env.PGPASSWORD,
       port: process.env.PGPORT,
       ssl: require
      })

      await client.connect()
      //const res = await client.query('SELECT * FROM users')
      //console.log(res)
      console.log("Opened database connection");
      
     } catch (error) {
      console.log(error)
     }
    }

const disconnectDB = async () => {
    setTimeout(function(){
        client.end();
        console.log("Closed database connection");
    }, 5000);
}
    


const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));
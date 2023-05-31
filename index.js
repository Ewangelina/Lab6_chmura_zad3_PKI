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

//https://www.linuxscrew.com/postgresql-show-tables-show-databases-show-columns
//SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'  <- tables
//SELECT column_name FROM information_schema.columns WHERE table_name = 'users'; <- columns

app.get('/temp', function (req, res) 
{
    connectDb();
    const table = req.query.table;
    ret = `    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
    Database: USER`;
    if (table) //has chosen table
    {
        let command = `SELECT * FROM ` + table;
        ret += `<table id="dtBasicExample" class="table table-striped table-bordered table-sm" cellspacing="0" width="100%">
                  <thead>
                    <tr>
                      <th class="th-sm">Name
                      </th>
                      <th class="th-sm">Position
                      </th>
                      <th class="th-sm">Office
                      </th>
                      <th class="th-sm">Age
                      </th>
                      <th class="th-sm">Start date
                      </th>
                      <th class="th-sm">Salary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Tiger Nixon</td>
                      <td>System Architect</td>
                      <td>Edinburgh</td>
                      <td>61</td>
                      <td>2011/04/25</td>
                      <td>$320,800</td>
                    </tr>
                    <tr>
                      <td>Garrett Winters</td>
                      <td>Accountant</td>
                      <td>Tokyo</td>
                      <td>63</td>
                      <td>2011/07/25</td>
                      <td>$170,750</td>
                    </tr>
                    <tr>
                      <td>Ashton Cox</td>
                      <td>Junior Technical Author</td>
                      <td>San Francisco</td>
                      <td>66</td>
                      <td>2009/01/12</td>
                      <td>$86,000</td>
                    </tr>
                  </tbody>
                </table>`
        client.query(command).then((response) => 
        {
            
                for (row in response)
                {
                    ret += row + '<br>';
                    console.log(row);
                }
                
                ret += `</ul></div>`;
                ret += `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>`;
                res.send(ret);
            
        });
        
    }
    else
    {
        
        ret += `<div class="dropdown">
        <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
          Dropdown button
        </button>
        <ul class="dropdown-menu">`;
        client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'").then((error, response) => 
        {
           
                for (row in response)
                {
                    ret += `<li><a class="dropdown-item" href="https://lab6-zad3.onrender.com/temp?table=` + row +`">` + row + `</a></li>`;
                }
                
                ret += `</ul></div>`;
                ret += `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>`;
                res.send(ret);
            
        });
          
         
        
        
    }

    disconnectDB();
    return

    
    client.query("SELECT * FROM pg_catalog.pg_tables where tableowner = 'Ewangelina'").then((error, response) => 
    {
        if (error)
        {
            console.log(error);
        }
        else
        {
            for (row in response)
            {
                console.log(row);
            }
        }
    })
    
   
});


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
      username = response.data.toString();
      console.log(response.data);
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

    res.send(ret);
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
        /*
        oauth2 = google.oauth2({auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.v2.me.get(function(err, result) {
            if (err) return console.log('Returned an error: ' + err);
            else
            {
                username = result.data.name;
            }
        });
        */

        ret += `    <div class="container">`;
        ret += `        <h1>Logged in</h1>`;
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
  username = "";
  try
  {
      var auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(function () {
          console.log('User signed out.');
          res.send("Logged out");
      });
  }
  catch (err)
  {
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

        res.send(ret);       
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
    let text = " ";
    client.query('SELECT * FROM users')
    .then((result1) => {
    text+=`
    ID	NAME	JOINED	LASTVISIT	COUNTER	AUTHTYPE
    Dane z bazy
    `
    
    for (let row of result1.rows) {
        console.log(row);
    text+=' '+row.id+' '+row.name+' '+row.joined+' '+row.lastvisit+' '+row.counter+' '
    }
    console.log(text);
    disconnectDB();
    res.send(text);
    })

    
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

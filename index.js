const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')
const axios = require('axios')
const { Client } = require("pg")
const dotenv = require("dotenv")
dotenv.config()

const app = express()
//https://lab6-zad3.onrender.com/auth/google/callback
const CLIENT_ID = OAuth2Data.web.client_id; 
const CLIENT_SECRET = OAuth2Data.web.client_secret; 
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;

const clientID = "189a8fb8aff66b200a36";
const clientSecret = "84ea18cd3fe49b8ea62f7417747c5a189359454a";
let client;

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?options=project%3D${ENDPOINT_ID}`;

app.set('view engine', 'ejs');
var access_token = "";

app.get('/auth/github/callback', (req, res) => {

    // The req.query object has the query params that were sent to this route.
    const requestToken = req.query.code
    
    axios({
      method: 'post',
      url: `https://github.com/login/oauth/access_token?client_id=${clientID}&client_secret=${clientSecret}&code=${requestToken}&sslmode=require`,
      // Set the content type header, so that we get the response in JSON
      headers: {
           accept: 'application/json'
      }
    }).then((response) => {
      access_token = response.data.access_token
      res.redirect('/success');
    })
  })
  
  app.get('/success', function(req, res) {
    res.send(`Signed in with Github`);
  });

app.get('/', (req, res) => {
    var ret = "";
    if (authed)
    {
      ret += `Logged in with google<br>`;
    }
    ret += `<a href="https://lab6-zad3.onrender.com/google" target="_blank">Sign in with Google</a>`; //https://lab6-zad3.onrender.com/google
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
        console.log(url)
        res.redirect(url);
    } else {
        var oauth2 = google.oauth2({auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.v2.me.get(function(err, result) {
            if (err) return console.log('Returned an error: ' + err);
            else
            {
                loggedUser = result.data.name;
                var ret = "Hello " + loggedUser;
                ret += `<a href="https://lab6-zad3.onrender.com/googleout" target="_blank">Sign in with Google</a>`;
            }
        });
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
                res.redirect('/')
            }
        });
    }
});

app.get('/db', function (req, res) {
    console.log("Pobieranie danych");
    let ret = "from database\n";
    client.query('SELECT * FROM users', (error, res) => {
        if (reeor) {
            ret += "ERROR";
            throw(error);
        }
        console.log("Odebrane dane");
        for (let row of res.rows){
            ret += JSON.stringify(row) + "\n";
            console.log(JSON.stringify(row));
        }
    })

    res.send(ret);
});

const connectDb = async () => {
     try {
       client = new Client({
       user: process.env.PGUSER,
       host: process.env.PGHOST,
       database: process.env.PGDATABASE,
       password: process.env.PGPASSWORD,
       port: process.env.PGPORT
      })

      await client.connect()
      const res = await client.query('SELECT * FROM users')
      console.log(res)
      await client.end()
     } catch (error) {
      console.log(error)
     }
    }
    
    connectDb()

const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));
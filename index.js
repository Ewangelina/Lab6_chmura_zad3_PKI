const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id; 
const CLIENT_SECRET = OAuth2Data.web.client_secret; 
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var authed = false;

app.get('/', (req, res) => {
    res.write(`<a href="https://lab6-zad3.onrender.com/google" target="_blank">Sign in with Google</a>`);
    res.write(`<br>`);
    res.write(`<a href="https://github.com/login/oauth/authorize?client_id=<%= client_id %>" class="btn btn-danger"><span class="fa fa-github"></span> Sign in with Github</a>`);
});

app.get('/google/out', (req, res) => {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
    console.log('User signed out.');
    });
});

app.get('/google', (req, res) => {
    if (!authed) 
    {
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        console.log(url)
        res.redirect(url);
    } 
    else 
    {
        var oauth2 = google.oauth2({auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.v2.me.get(function(err, result) {
            if (err)
            {
                console.log('ERROR');
                console.log(err);
            }
            else
            {
                loggedUser = result.data.name;
                console.log(loggedUser);
            }

            res.send('Logged in: '.concat(loggedUser, ' <img src = "', result.data.picture, '" height="23" width="23"> <br> <a href="#" onclick="signOut();">Sign out</a>'+
            '<script> function signOut() { var auth2 = gapi.auth2.getAuthInstance(); auth2.signOut().then(function () {'+
                  'console.log("User signed out."); window.location.replace("https://lab6-zad3.onrender.com/");'+
                '});}</script>'));
        })
    }
});

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

app.get('/auth/github/callback', function (req, res) {
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
        access_token = response.data.access_token
        res.redirect('/success');
    })
});

app.get('/success', function(req, res) {

    axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {
        Authorization: 'token ' + access_token
      }
    }).then((response) => {
        res.write(`<div class="container">`);
        res.write(`  <div class="jumbotron">`);
        res.write(`      <h1 class="text-primary  text-center"><span class="fa fa-github"></span> Github Information</h1>`);
        res.write(`      <div class="row">`);
        res.write(`        <div class="col-sm-6">`);
        res.write(`          <div class="well">`);
        res.write(`            <p>`);
        res.write(`              <strong>Name</strong>: <%= userData.name %><br>`);
        res.write(`              <strong>Username</strong>: <%= userData.login %><br>`);
        res.write(`                <strong>Company</strong>: <%= userData.company %><br>`);
        res.write(`                <strong>Bio</strong>: <%= userData.bio %>`);
        res.write(`            </p>`);
        res.write(`          </div>`);
        res.write(`        </div>`);
        res.write(`    </div>`);
        res.write(`  </div>`);
        res.write(`</div>`);
        
    })
  });

const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));

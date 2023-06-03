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
let oauth2;

const clientID = "189a8fb8aff66b200a36";
const clientSecret = "84ea18cd3fe49b8ea62f7417747c5a189359454a";
let client;

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require?options=project%3D${ENDPOINT_ID}`;
const sql = postgres(URL, { ssl: 'require' });
app.set('view engine', 'ejs');
let access_token = "";
let table = "";
let lastSQL = "";


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

function getTable(command)
{
    let words = command.split(" ");
    for (var i = 0; i < words.length; i++)
    {
        if (words[i].toLowerCase() == "from")
        {
            return words[i+1];
        }
    }
    
    return '';
}

app.get('/test', function(req, res)
{
    ret = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <link rel="stylesheet" href="https://cdn.datatables.net/1.10.22/css/dataTables.bootstrap4.min.css">
    <script src="https://cdn.datatables.net/1.10.22/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.10.22/js/dataTables.bootstrap4.min.js"></script>
    </head>
    <body>
    <div class="container" style="width:100%";>
    <p>Databse: USER<br>Table: ` + table + `</p>
    <table class="table table-striped table-bordered" id="sortTable">
    <thead>
    <tr>
    <th>Firstname</th>
    <th>Lastname</th>
    <th>Email</th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>Adam</td>
    <td>joo</td>
    <td>Jadamj@yahoo.com</td>
    </tr>
    <tr>
    <td>seri</td>
    <td>sami</td>
    <td>ami_seri@rediff.com</td>
    </tr>
    <tr>
    <td>zeniya</td>
    <td>deo</td>
    <td>zee@gmail.com</td>
    </tr>
    </tbody>
    </table>
    </div>
    <script>
    $('#sortTable').DataTable();
    </script>
    </body>
    </html>`;
    
    res.send(ret);
});

//https://www.linuxscrew.com/postgresql-show-tables-show-databases-show-columns
//SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'  <- tables
//SELECT column_name FROM information_schema.columns WHERE table_name = 'users'; <- columns

//https://mdbootstrap.com/docs/b4/jquery/tables/sort/
app.get('/temp', function (req, res) 
{
    connectDb();
    table = req.query.table;
    let sql = req.query.command;
    let ret = `    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
    Database: USER<br>`;
    
    if (table) //has chosen table
    {
        if (sql) //widok (wyświetlanie tabeli)
        {
            try 
            {
                if (sql == "*")
                {
                    sql = "SELECT * FROM " + table;
                }
                else
                {
                    sql = sql.replace("%20", " ");
                    let tempTable = getTable(sql);
                    if (tempTable == '')
                    {
                        res.send("Could not process query");
                        disconnectDB();
                        return;
                    }
                    else
                    {
                        table = tempTable;
                    }
                }
                lastSQL = sql;
                let columnCommand = `SELECT column_name FROM information_schema.columns WHERE table_name = '` + table + `'`
                ret = `<!DOCTYPE html>
                        <html lang="en">
                        <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
                        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
                        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
                        <link rel="stylesheet" href="https://cdn.datatables.net/1.10.22/css/dataTables.bootstrap4.min.css">
                        <script src="https://cdn.datatables.net/1.10.22/js/jquery.dataTables.min.js"></script>
                        <script src="https://cdn.datatables.net/1.10.22/js/dataTables.bootstrap4.min.js"></script>
                        </head>
                        <body>
                        <div class="container" style="width:100%";>
                        <p>Databse: USER<br>Table: ` + table + `</p>
                        <a href="https://lab6-zad3.onrender.com/temp">RETURN</a>
                        <table class="table table-striped table-bordered" id="sortTable">
                        <thead>
                        <tr>`
                client.query(columnCommand).then((innerResponse, error) => 
                {
                    if (error)
                    {
                        res.send("Could not process query");
                        console.log(error);
                        disconnectDB();
                        return;
                    }

                    for (let i = 0; i < innerResponse.rows.length; i++) 
                    {
                        ret += `<th class="th-sm">` + innerResponse.rows[i].column_name + `</th>`;
                    }
                    ret += `</tr>
                            </thead>
                            <tbody>`;

                    client.query(lastSQL).then((response, error) => 
                    {
                        if (error)
                        {
                            res.send("Could not process query");
                            console.log(error);
                            disconnectDB();
                            return;
                        }
                        else
                        {
                            
                            for (var j = 0; j < response.rows.length; j++)
                            {
                                let valuesArray = Object.values(response.rows[j]);
                                ret += `<tr>`;
                                for (var i = 0; i < valuesArray.length; i++)
                                {
                                    ret += `<td>` + valuesArray[i] + `</td>`;
                                }

                                ret += `</tr>`;
                            }
                            ret += `</tbody>
                                    </table>
                                    </div>
                                    <script>
                                    $('#sortTable').DataTable();
                                    </script>
                                    </body>
                                    </html>`;
                        }
                        
                        res.send(ret);
                    });
                }).catch((error) => {
                    res.send("Could not process query");
                    console.log(error);
                    disconnectDB();
                    return;
                  });
            }
            catch (error)
            {
                res.send("Could not process query");
                console.log(error);
                disconnectDB();
                return;
            }
        }
        else
        {
            ret += `Table: ` + table + "<br>";
            ret += `<script>$(document).ready(function () {
                $('#dtBasicExample').DataTable();
                $('.dataTables_length').addClass('bs-select');
              });</script><table id="dtBasicExample" class="table table-striped table-bordered table-sm" cellspacing="0" width="100%">
                                <thead>
                                  <tr>`
            let c = `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'AND table_schema NOT IN ('pg_catalog', 'information_schema');`;

            ret += `<div class="dropdown">
            <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
            Reselect table
            </button>
            <ul class="dropdown-menu">`;
            client.query(c).then((response) => 
            {
                for (let i = 0; i < response.rows.length; i++) 
                {
                    ret += `<li><a class="dropdown-item" href="https://lab6-zad3.onrender.com/temp?table=` + response.rows[i].table_name +`">` + response.rows[i].table_name + `</a></li>`;
                }

                ret += `</ul></div><br>`;
                ret += `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>`;
                ret += `<label>Tu wpisz komendę \\|/</label>
                    <button onclick="show_all()">Pokaż wszystko</button><br>
                    <input type="text" id="input" value="` + lastSQL + `">
                    <button onclick="command()">Wyślij zapytanie</button>

                    <script type="text/javascript">
                        async function show_all()
                        {
                            window.location.href = window.location.href + "&command=*";
                        }
                    </script>
                    <script type="text/javascript">
                        async function command()
                        {
                            let c = document.getElementById('input').value;
                            if (c == "")
                            {
                                return
                            }
                            c = c.replace(" ","%20");
                            window.location.href = window.location.href + "&command=" + c;
                        }
                    </script>`;
                res.send(ret);
            });  
        }      
    }
    else
    {
        ret += `<div class="dropdown">
        <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
          Select table
        </button>
        <ul class="dropdown-menu">`;
        client.query("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'AND table_schema NOT IN ('pg_catalog', 'information_schema');").then((response) => 
        {
            for (let i = 0; i < response.rows.length; i++) 
            {
                ret += `<li><a class="dropdown-item" href="https://lab6-zad3.onrender.com/temp?table=` + response.rows[i].table_name +`">` + response.rows[i].table_name + `</a></li>`;
            }          
            ret += `</ul></div><br>`;
            ret += `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>`;
            res.send(ret);

        });
    }

    disconnectDB();
}).catch(function (req, res) {
    console.log("Promise Rejected");
    res.send("Could not process query");
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
    return
    setTimeout(function(){
        client.end();
        console.log("Closed database connection");
    }, 2000);
}
    


const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));

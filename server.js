'use strict';

/*********************************DEPENDENCIES***********************************/
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

/*********************************CONST DECLARATIONS*****************************/
const app = express();
const PORT = 3000;
const conString = process.env.DATABASE_URL;
const client = new pg.Client(conString);

/*********************************MIDDLEWARE*************************************/
app.use(bodyParser.json);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

/*********************************OTHER SETUP************************************/
client.connect();
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

/*********************************POSTS******************************************/
app.post('/api/db/users', (req,res) => {
  console.logO('hit post route');
  res.send('hit get route');
});


/*********************************GETS*******************************************/
app.get('/api/db/users/:id', (req,res) => {
  console.log('hit get route');
  res.send('hit test route');
});

/*********************************PUTS*******************************************/


/*********************************DELETES****************************************/


'use strict';

/*********************************DEPENDENCIES***********************************/
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

/*********************************CONST DECLARATIONS*****************************/
const app = express();
const PORT = process.env.PORT;
const conString = process.env.DATABASE_URL;
const client = new pg.Client(conString);

/*********************************MIDDLEWARE*************************************/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

/*********************************OTHER SETUP************************************/
client.connect();
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

/*********************************POSTS******************************************/
app.post('/api/db/users', (req,res) => {
  res.send('hit post route');
});

/*********************************GETS*******************************************/
app.get('/api/db/users/:id', (req,res) => {
  res.send('hit get route');
});

/*********************************PUTS*******************************************/
app.put('/api/db/users/:id', (req,res) => {
  res.send('hit put route');
});

/*********************************DELETES****************************************/
app.delete('/api/db/users/:id', (req,res) => {
  res.send('hit delete route');
});

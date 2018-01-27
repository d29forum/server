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
  client.query(`INSERT INTO users (first_name, last_name, email, username, password_hash, interests, created_on, num_comments, role, last_login, gravatar_hash) VALUES ($1,$2,$3,$4,'N/A',$5,to_timestamp(${Date.now()}/1000),0,$6,to_timestamp(${Date.now()}/1000),$7);`,
    [req.body.first_name, req.body.last_name, req.body.email, req.body.username, req.body.interests, req.body.role, req.body.gravatar_hash]);
});

/*********************************GETS*******************************************/
app.get('/api/db/users/:id', (req,res) => {
  client.query(`SELECT * FROM users WHERE id=$1;`, [req.params.id])
  .then(result => res.send(result.rows));
});

/*********************************PUTS*******************************************/
app.put('/api/db/users/:id/login', (req,res) => {
  client.query(`UPDATE users SET last_login = to_timestamp(${Date.now()}/1000) WHERE id=$1;`,
    [req.params.id]);
});

app.put('/api/db/users/:id', (req,res) => {
  client.query(`UPDATE users SET first_name=$1, last_name=$2, email=$3, username=$4, interests=$5, role=$6, gravatar_hash=$7 WHERE id=$8;`,
    [req.body.first_name, req.body.last_name, req.body.email, req.body.username, req.body.interests, req.body.role, req.body.gravatar_hash, req.params.id]);
});

/*********************************DELETES****************************************/
app.delete('/api/db/users/:id', (req,res) => {
  client.query(`DELETE FROM users WHERE id=$1;`, [req.params.id]);
});

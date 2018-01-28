'use strict';

/*********************************DEPENDENCIES***********************************/
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

/*********************************CONST DECLARATIONS*****************************/
const app = express();
const PORT = process.env.PORT || 3737;
// const conString = process.env.DATABASE_URL;
const conString = 'postgres://localhost:5432/d29forum';
const client = new pg.Client(conString);

/*********************************MIDDLEWARE*************************************/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

/*********************************OTHER SETUP************************************/
client.connect();
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

/*********************************POSTS******************************************/
//USER MODEL
app.post('/api/db/users', (req,res) => {
  client.query(`INSERT INTO users (first_name, last_name, username, password_hash, interests, created_on, num_comments, role, last_login, gravatar_hash) VALUES ('','',$1,'N/A','',to_timestamp(${Date.now()}/1000),0,'user',to_timestamp(${Date.now()}/1000),'');`,
    [req.body.username])
    .then(() => {
      client.query(`SELECT id FROM users WHERE username=$1;`,
      [req.body.username])
      .then(result => res.send(result.rows));
    })
    
});

//COMMENT MODEL
app.post('/api/db/comments', (req,res) => {
  client.query(`INSERT INTO comments (content, created_on, creator, thread_parent, subforum_parent) VALUES ($1, to_timestamp(${Date.now()}/1000), $2, $3, $4);`,
    [req.body.content, req.body.creator, req.body.thread_parent, req.body.subforum_parent]);
});

/*********************************GETS*******************************************/
//USER MODEL
app.get('/api/db/users/:username', (req,res) => {
  client.query(`SELECT * FROM users WHERE username=$1;`, [req.params.username])
  .then(result => res.send(result.rows));
});

//THREAD MODEL
app.get('/api/db/thread/:id', (req,res) => {
  client.query(`SELECT * FROM comments INNER JOIN users ON comments.creator = users.id WHERE thread_parent=$1;`, [req.params.id])
  .then(result => res.send(result.rows));
});

/*********************************PUTS*******************************************/
//USER MODEL
app.put('/api/db/users/:username/login', (req,res) => {
  client.query(`UPDATE users SET last_login = to_timestamp(${Date.now()}/1000) WHERE username=$1;`,
    [req.params.username]);
});

app.put('/api/db/users/:username', (req,res) => {
  if(req.body.email) {
    client.query(`UPDATE users SET first_name=$1, last_name=$2, email=$3, username=$4, interests=$5, gravatar_hash=$6 WHERE username=$7;`,
    [req.body.first_name, req.body.last_name, req.body.email, req.body.username, req.body.interests, req.body.gravatar_hash, req.params.username])
    .then(() => res.send(req.body.username));
  }
  else {
    client.query(`UPDATE users SET first_name=$1, last_name=$2, username=$3, interests=$4, gravatar_hash=$5 WHERE username=$6;`,
    [req.body.first_name, req.body.last_name, req.body.username, req.body.interests, req.body.gravatar_hash, req.params.username])
    .then(() => res.send(req.body.username));
  }
});

//COMMENTS MODEL
app.put('/api/db/comments/:id', (req,res) => {
  client.query(`UPDATE comments SET content=$1 WHERE id=$2;`,
    [req.body.content, req.params.id]);
});

/*********************************DELETES****************************************/
//USER MODEL
app.delete('/api/db/users/:username', (req,res) => {
  client.query(`DELETE FROM users WHERE username=$1;`, [req.params.username])
    .then(result => res.send('success'));
});

//COMMENT MODEL
app.delete('/api/db/comments/:id', (req,res) => {
  client.query(`DELETE FROM comments WHERE id = $1`, [req.params.id]);
});

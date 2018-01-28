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
    .then(() => res.send('Post complete'))
    .catch(console.error);
});

//COMMENT MODEL
app.post('/api/db/comments', (req,res) => {
  client.query(`INSERT INTO comments (content, created_on, creator, thread_parent, subforum_parent) VALUES ($1, to_timestamp(${Date.now()}/1000), $2, $3, $4);`,
    [req.body.content, req.body.creator, req.body.thread_parent, req.body.subforum_parent]);
});

//THREAD MODEL
app.post('api/db/threads', (req,res) => {
  client.query(`INSERT INTO threads (title,creator,subforum_parent,created_on,comment_count,view_count,last_comment) VALUES ($1,$2,$3,to_timestamp(${Date.now()}/1000),1,1,$4);`,
    [req.body.title, req.body.creator, req.body.subforum_parent, req.body.last_comment]);
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
  client.query(`UPDATE users SET first_name=$1, last_name=$2, email=$3, username=$4, interests=$5, role=$6, gravatar_hash=$7 WHERE username=$8;`,
    [req.body.first_name, req.body.last_name, req.body.email, req.body.username, req.body.interests, req.body.role, req.body.gravatar_hash, req.params.username]);
});

//COMMENTS MODEL
app.put('/api/db/comments/:id', (req,res) => {
  client.query(`UPDATE comments SET content=$1 WHERE id=$2;`,
    [req.body.content, req.params.id]);
});

//THREADS MODEL
app.put('api/db/threads/:id', (req,res) => {
  client.query(`UPDATE threads SET title=$1, subforum_parent=$2 WHERE id=$3;`,
    [req.body.title, req.body.subforum_parent, req.params.id]);
});

/*********************************DELETES****************************************/
//USER MODEL
app.delete('/api/db/users/:username', (req,res) => {
  client.query(`DELETE FROM users WHERE username=$1;`, [req.params.username]);
});

//COMMENT MODEL
app.delete('/api/db/comments/:id', (req,res) => {
  client.query(`DELETE FROM comments WHERE id = $1;`, [req.params.id]);
});

//THREADS MODEL
app.delete('api/db/threads/:id', (req,res) => {
  client.query(`DELETE FROM threads WHERE id = $1;`, [req.params.id]);
});

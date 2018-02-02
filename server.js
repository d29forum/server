'use strict';

/*********************************DEPENDENCIES***********************************/
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

/*********************************CONST DECLARATIONS*****************************/
const app = express();
const PORT = process.env.PORT //|| 3737;
const conString = process.env.DATABASE_URL;
// const conString = 'postgres://localhost:5432/d29forum';
const client = new pg.Client(conString);

/*********************************MIDDLEWARE*************************************/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

/*********************************OTHER SETUP************************************/
client.connect();
app.set('etag', 'strong'); 
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

/*********************************POSTS******************************************/
//USER MODEL
app.post('/api/db/users', (req,res) => {
  client.query(`INSERT INTO users (first_name, last_name, username, password_hash, interests, created_on, num_comments, role, last_login, gravatar_hash) VALUES ('','',$1,'N/A','',to_timestamp(${Date.now()}/1000),0,'user',to_timestamp(${Date.now()}/1000),'');`,
    [req.body.username])
    .then(() => {
      client.query(`SELECT * FROM users WHERE username=$1;`,
      [req.body.username])
      .then(result => {
        if (!result.rows.length) throw 'Username already exists';
        // console.log(result.rows);
         res.status(200).send(result.rows);})
    })
    .catch(err => { console.log(err); res.status(500).send(err.code);});
});

//COMMENT MODEL
app.post('/api/db/comments', (req,res) => {
  client.query(`INSERT INTO comments (content, created_on, creator, thread_parent, subforum_parent) VALUES ($1, to_timestamp(${Date.now()}/1000), $2, $3, $4) RETURNING id AS content_id;`,
    [req.body.content, req.body.creator, req.body.thread_parent, req.body.subforum_parent])
    .then(result => {
      client.query(`UPDATE users SET num_comments = num_comments + 1 WHERE id=$1;`, [req.body.creator]);
      client.query(`UPDATE threads SET comment_count = comment_count + 1, last_comment_cache = last_comment, last_comment = $2 WHERE id=$1;`, [req.body.thread_parent, result.rows[0].content_id]);
      client.query(`UPDATE subfora SET comment_count = comment_count + 1, last_comment_cache = last_comment, last_comment = $2 WHERE id=$1;`, [req.body.subforum_parent, result.rows[0].content_id]);
    })
    .then(result=>res.send(result));
});

//THREAD MODEL
app.post('/api/db/threads', (req,res) => {
  client.query(`INSERT INTO threads (title,creator,subforum_parent,created_on,comment_count,view_count,last_comment) VALUES ($1,$2,$3,to_timestamp(${Date.now()}/1000),1,1,2) RETURNING id AS thread_id;`,
    [req.body.title, req.body.creator, req.body.subforum_parent])
    .then(result => {
      client.query(`INSERT INTO comments(content, created_on, creator, thread_parent, subforum_parent) VALUES ($1, to_timestamp(${Date.now()}/1000), $2, $4, $3) RETURNING id AS comment_id, thread_parent AS thread_id, subforum_parent AS subforum_id`,
        [req.body.content, req.body.creator, req.body.subforum_parent, result.rows[0].thread_id])
          .then(result=> {
            client.query(`UPDATE subfora SET last_comment_cache = last_comment, last_comment = $1 WHERE id=$2;`, [result.rows[0].comment_id, result.rows[0].subforum_id]);
            client.query(`UPDATE threads SET last_comment_cache = last_comment, last_comment = $1 WHERE id=$2 RETURNING id AS thread_id, last_comment AS comment_id;`,
              [result.rows[0].comment_id, result.rows[0].thread_id])
                .then(result => {
                  client.query(`UPDATE users SET num_comments = num_comments + 1 WHERE id=$1;`, [req.body.creator]);
                  console.log(req.body.subforum_parent + ' ' + result.rows[0].comment_id);
                  client.query(`UPDATE subfora SET comment_count = comment_count + 1, thread_count = thread_count + 1, last_comment = $2 WHERE id=$1;`, [req.body.subforum_parent, result.rows[0].comment_id]);
                  res.send(result.rows);
                });
          });
    });
});

//SUBFORUM MODEL
app.post('/api/db/subfora', (req,res) => {
  client.query(`INSERT INTO subfora (title, subtitle, thread_count, comment_count, last_comment) VALUES ($1,$2,0,0,1);`,
    [req.body.title, req.body.subtitle])
    .then(() => res.send('success'));
});
/*********************************GETS*******************************************/
//USER MODEL
app.get('/api/db/users/:username', (req,res) => {
  console.log('hit username get');
  client.query(`SELECT * FROM users WHERE username=$1;`, [req.params.username])
  .then(client.query(`UPDATE users SET last_login = to_timestamp(${Date.now()}/1000) WHERE username=$1;`, [req.params.username]))
  .then(result => {
    if (!result.rows.length) throw 'User does not exist';
    res.status(200).send(result.rows);})
  .catch(err => { console.log(err); res.status(500).send(err);});
});

//THREAD MODEL
app.get('/api/db/thread/:id', (req,res) => {
  client.query(`SELECT threads.id AS thread_id, subfora.id AS subforum_id, comments.id AS comment_id, comments.created_on AS comment_created_on, subfora.title AS subforum_title, threads.title AS thread_title, username, users.created_on AS user_created_on, num_comments, gravatar_hash, content FROM comments INNER JOIN users ON comments.creator = users.id INNER JOIN subfora ON comments.subforum_parent = subfora.id INNER JOIN threads ON comments.thread_parent = threads.id WHERE thread_parent=$1;`, [req.params.id])
  .then(client.query(`UPDATE threads SET view_count = view_count + 1 WHERE id = $1;`, [req.params.id]))
  .then(result => res.header('Access-Control-Expose-Headers', 'ETag').send(result.rows));
});

//SUBFORUM MODEL BY ID
app.get('/api/db/subfora/:id', (req,res) => {
  var queries = {};
  queries.results = [];

  client.query(`SELECT comments.content, users.gravatar_hash, subfora.id AS subforum_id, comments.id AS comment_id, subfora.title AS subforum_title, threads.id AS thread_id, threads.title, users.username AS thread_creator, view_count, threads.comment_count, comments.created_on AS last_comment_created_on FROM threads INNER JOIN comments ON threads.last_comment = comments.id INNER JOIN users ON threads.creator = users.id JOIN subfora ON threads.subforum_parent = subfora.id WHERE threads.subforum_parent=$1;`, [req.params.id])
  .then(result => queries.rows = result.rows);

  client.query(`SELECT users.username AS last_commenter FROM threads INNER JOIN comments ON threads.last_comment = comments.id INNER JOIN users ON comments.creator = users.id WHERE threads.subforum_parent=$1;`, [req.params.id])
  .then(result => { for (var i = 0; i < result.rows.length; i++) queries.results.push(Object.assign({},result.rows[i],queries.rows[i]));})

  // client.query(`SELECT comments.content, users.gravatar_hash FROM subfora INNER JOIN comments ON subfora.last_comment = comments.id INNER JOIN users ON comments.creator = users.id WHERE subfora.id=$1;`, [req.params.id])
  // .then(result => { for (var i = 0; i < result.rows.length; i++) queries.results2.push(Object.assign({},result.rows[i],queries.rows[i])); console.log(result)})

  .then(() => res.send(queries.results));
});


// users.gravatar_hash
// comments.content
// FORUM VIEW GETS ALL SUBFORAS AKA HOME APGE
app.get('/api/db/forum', (req, res) => {
  client.query(`SELECT subfora.id AS subforaId, subfora.title, subfora.subtitle, subfora.comment_count, subfora.thread_count, comments.content, comments.created_on, comments.thread_parent AS commentThreadParent, comments.subforum_parent AS commentSubforumParent, comments.id AS commentId, users.gravatar_hash, users.username FROM subfora INNER JOIN comments ON subfora.last_comment = comments.id INNER JOIN users ON comments.creator = users.id;`)
  .then(function(data) {
    res.send(data.rows);
  })
  .catch(function(err) {
    console.error(err);
  })
});

// app.get('/api/db/forum', (req, res) => {
//   client.query(`SELECT subfora.id AS subforaId, subfora.title, subfora.subtitle, subfora.comment_count, subfora.thread_count, comments.created_on, comments.thread_parent AS commentThreadParent, comments.subforum_parent AS commentSubforumParent, comments.id AS commentId, users.username FROM subfora INNER JOIN comments ON subfora.last_comment = comments.id INNER JOIN users ON comments.creator = users.id;`)
//   .then(function(data) {
//     res.send(data.rows);
//   })
//   .catch(function(err) {
//     console.error(err);
//   })
// });

/*********************************PUTS*******************************************/
//USER MODEL
app.put('/api/db/users/:username', (req,res) => {
  if(req.body.email) {
    client.query(`UPDATE users SET first_name=$1, last_name=$2, email=$3, username=$4, interests=$5, gravatar_hash=$6 WHERE username=$7;`,
    [req.body.first_name, req.body.last_name, req.body.email, req.body.username, req.body.interests, req.body.gravatar_hash, req.params.username])
    .then(() => {
    let user = {username: req.body.username, gravatar_hash: req.body.gravatar_hash}; 
    res.send(user);
  })
}
  else {
    client.query(`UPDATE users SET first_name=$1, last_name=$2, username=$3, interests=$4, gravatar_hash=$5 WHERE username=$6;`,
    [req.body.first_name, req.body.last_name, req.body.username, req.body.interests, req.body.gravatar_hash, req.params.username])
    .then(() => {
      let user = {username: req.body.username, gravatar_hash: req.body.gravatar_hash}; 
      res.send(user);
    })
  }
});

//COMMENTS MODEL
app.put('/api/db/comments/:id', (req,res) => {
  client.query(`UPDATE comments SET content=$1 WHERE id=$2;`,
    [req.body.content, req.params.id])
    .then(() => res.send(req.params.id));
});

//THREADS MODEL
app.put('api/db/threads/:id', (req,res) => {
  client.query(`UPDATE threads SET title=$1, subforum_parent=$2 WHERE id=$3;`,
    [req.body.title, req.body.subforum_parent, req.params.id])
    .then(() => res.send(req.params.id));
});

//SUBFORUM MODEL
app.put('api/db/subfora/:id', (req,reqs) => {
  client.query(`UPDATE subfora SET title=$1, subtitle=$2 WHERE id=$3;`,
    [req.body.title, req.body.subtitle, req.params.id])
    .then(() => res.send(req.params.id));
});

/*********************************DELETES****************************************/
//USER MODEL
app.delete('/api/db/users/:username', (req,res) => {
  client.query(`DELETE FROM users WHERE username=$1;`, [req.params.username])
    .then(result => res.send('success'));
});

//COMMENT MODEL
app.delete('/api/db/comments/:id', (req,res) => {
  client.query(`UPDATE subfora SET last_comment = last_comment_cache, comment_count = comment_count - 1 WHERE last_comment=$1;`, [req.params.id]);
  client.query(`UPDATE threads SET last_comment = last_comment_cache, comment_count = comment_count - 1  WHERE last_comment=$1;`, [req.params.id]);
  client.query(`DELETE FROM comments WHERE id = $1;`, [req.params.id])
  .then(() => res.send(req.params.id));
});

//THREADS MODEL
app.delete('api/db/threads/:id', (req,res) => {
  client.query(`DELETE FROM threads WHERE id = $1;`, [req.params.id])
  .then(() => res.send(req.params.id));
});

//SUBFORUM MODEL
app.put('api/db/subfora/:id', (req,res) => {
  client.query(`DELETE FROM subfora WHERE id=$1;`, [req.params.id])
  .then(() => res.send(req.params.id))
});

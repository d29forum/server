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
app.use(bodyParser.json);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

/*********************************OTHER SETUP************************************/
client.connect();
app.listen(PORT, () => console.log(`Listening on port ${PORT}`);

/*********************************POSTS******************************************/


/*********************************GETS*******************************************/


/*********************************PUTS*******************************************/


/*********************************DELETES****************************************/

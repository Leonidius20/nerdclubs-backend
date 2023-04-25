const express = require('express');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const argon2 = require('argon2');
var bodyParser = require('body-parser');

dotenv.config();

const passwordPepper = process.env.PASSWORD_PEPPER;


const dbPool = new Pool(); // uses process.env.PG* variables by default
// TODO: create a new "backend" user in db with limited permissions

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello World!'));

/**
 * @api {post} /users Create a new user
 */
app.post('/users', async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password || !req.body.email) {
        res.status(400).send('error 1: Missing required fields'); // todo: json woth error id
        return;
    }

    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    if (username.length < 3 || username.length > 20) {
        res.status(400).send('error 2: Username must be between 3 and 20 characters');
        return;
    }

    if (password.length < 8 || password.length > 20) {
        res.status(400).send('error 3: Password must be between 8 and 20 characters');
        return;
    }

    if (!email.includes('@')) { // todo: replace with regex
        res.status(400).send('error 4: Invalid email address');
        return;
    }

    let hash = '';
    try {
        hash = await argon2.hash(password + passwordPepper);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
        return;
    }

    // todo: sanitize input to avoid injections
    dbPool.query('insert into users (username, password_hash, email) values ($1, $2, $3)', [username, hash, email], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
        } else {
            res.status(201).send('User created');
        }
    });
});

/**
 * @api {get} /login Login 1st factor
 */
app.get('/login', (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(400).send('error 1: Missing required fields'); // todo: json woth error id
        return;
    }

    const username = req.body.username;
    const password = req.body.password;

    //todo: sanitize input to avoid injections
    dbPool.query('select password_hash from users where username = $1', [username], async (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
        } else {
            if (result.rows.length === 0) {
                res.status(401).send('Invalid username or password');
                return;
            }

            const hash = result.rows[0].password_hash;
            const valid = await argon2.verify(hash, password + passwordPepper);
            if (valid) {
                // todo JWT
                res.status(200).send('Login successful');
            } else {
                res.status(401).send('Invalid username or password');
            }
        }
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
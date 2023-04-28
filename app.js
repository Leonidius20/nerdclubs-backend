const express = require('express');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const argon2 = require('argon2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

/*
  Initial configuration
 */
dotenv.config();

const passwordPepper = process.env.PASSWORD_PEPPER;
const jwtSecret = process.env.JWT_SECRET;


const dbPool = new Pool(); // uses process.env.PG* variables by default
// TODO: create a new "backend" user in db with limited permissions

const app = express();
const port = process.env.APP_PORT;

app.use(bodyParser.json());

/*
  Middlewares
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).send('Invalid token');
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

/*
  Endpoints
 */

app.get('/', (req, res) => res.send('Hello World!'));

/**
 * @api {post} /users Create a new user
 */
app.post('/users', async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password || !req.body.email) {
        res.status(400).json({ error: 1, message: 'Missing required fields' });
        return;
    }

    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    if (username.length < 3 || username.length > 20) {
        res.status(400).json({ error: 2, message: 'Username must be between 3 and 20 characters'});
        return;
    }

    if (password.length < 8 || password.length > 20) {
        res.status(400).json({ error: 3, message: 'Password must be between 8 and 20 characters'});
        return;
    }

    if (!email.includes('@')) { // todo: replace with regex
        console.log(email);
        res.status(400).json({ error: 4, message: 'Invalid email address'});
        return;
    }

    let hash = '';
    try {
        hash = await argon2.hash(password + passwordPepper);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 5, message: 'Internal server error'});
        return;
    }

    dbPool.query('insert into users (username, password_hash, email) values ($1, $2, $3) returning user_id', [username, hash, email], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({error: 6, message: `Unable to create user: db says ${err}`});
        } else {
            const user_id = result.rows[0].user_id;

            res.status(200).json({
                    token: jwt.sign({ 
                        username, 
                        user_id, 
                        twofa_enabled: false,
                        twofa_passed: true 
                    }, jwtSecret)
            });
        }
    });
});

/**
 * @api {get} /users Get all users (only for testing) todo remove
 */
app.get('/users', (req, res) => {
    dbPool.query('select * from users', (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
        } else {
            res.status(200).send(result.rows);
        }
    });
});

/**
 * @api {post} /login Login 1st factor
 */
app.post('/login', (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(400).send('error 1: Missing required fields'); // todo: json woth error id
        return;
    }

    const username = req.body.username;
    const password = req.body.password;

    dbPool.query('select password_hash, user_id, twofa_secret from users where username = $1', [username], async (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 1, message: 'Internal server error'});
        } else {
            if (result.rows.length === 0) {
                res.status(401).json({ error: 2, message: 'Invalid username or password'});
                return;
            }

            const hash = result.rows[0].password_hash;
            const valid = await argon2.verify(hash, password + passwordPepper);

            const user_id = result.rows[0].user_id;
            if (valid) {
                const twoFactorRequired = result.rows[0].twofa_secret !== null;

                res.status(200).json({
                    token: jwt.sign({ username, user_id, twofa_enabled: twoFactorRequired, twofa_passed: !twoFactorRequired }, jwtSecret)
                });
            } else {
                res.status(401).json({ error: 2, message: 'Invalid username or password'});
            }
        }
    });
});

/**
 * @api {post} /login/2fa/add add 2nd factor
 */
app.post('/login/2fa/add', authenticateJWT, (req, res) => {
    if (req.user.twofa_enabled) {
        respondWithError(res, 400, 1, '2nd factor already enabled');
        return;
    }

    // confirm that there is no 2nd factor already enabled in the db
    dbPool.query('select twofa_secret, twofa_confirmed from users where user_id = $1', [req.user.user_id], (err, result) => {
        if (err) {
            console.error(err);
            respondWithError(res, 500, 2, 'Internal server error');
            return;
        } else {
            if (result.rows[0].twofa_secret !== null) {
                if (result.rows[0].twofa_confirmed) {
                    respondWithError(res, 400, 3, '2nd factor already enabled');
                    return;
                } else {
                    // respond with the secret
                    const secret = speakeasy.otpauthURL(
                        { secret: result.rows[0].twofa_secret, 
                            label: req.user.username, 
                            issuer: process.env.APP_NAME,
                            encoding: 'base32',
                        });

                    res.status(200).json({secret});
                    return;
                }
            } else {
                // generate a new secret
                const secret = speakeasy.generateSecret({
                    issuer: process.env.APP_NAME, 
                    label: req.user.username,
                    length: 20 
                });


                // save the secret in the db
                dbPool.query('update users set twofa_secret = $1 where user_id = $2', [secret.base32, req.user.user_id], (err, result) => {
                    if (err) {
                        console.error(err);
                        respondWithError(res, 500, 4, 'Internal server error');
                        return;
                    } else {
                        res.status(200).json({secret: secret.otpauth_url});
                        return;
                    }
                });
            }
        }
    });
});

/**
 * @api {post} /login/2fa/verify confirm enabling 2fa by verifying a code
 */
app.post('/login/2fa/verify', authenticateJWT, (req, res) => {
    if (req.user.twofa_passed) {
        res.status(400).send('already logged in');
        return;
    }

    if (!req.body || !req.body.otp) {
        res.status(400).send('missing required fields');
        return;
    }

    const otp = req.body.otp;

    dbPool.query('select twofa_secret from users where user_id = $1', [req.user.user_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
        } else {
            if (result.rows[0].twofa_secret === null) {
                res.status(400).send('2nd factor not enabled');
                return;
            }

            const verified = speakeasy.totp.verify({
                secret: result.rows[0].twofa_secret,
                encoding: 'base32',
                token: otp
            });

            if (verified) {
                // confirm verified 2fa in db
                dbPool.query('update users set twofa_confirmed = true where user_id = $1', [req.user.user_id], (err, result) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Internal server error');
                    }
                });

                res.status(200).send(jwt.sign({ 
                    username: req.user.username, 
                    user_id: req.user.user_id, 
                    twofa_enabled: true,
                    twofa_passed: true }, jwtSecret));
            } else {
                res.status(401).send('Invalid code');
            }
        }
    });

});

/**
 * @api {post} /login/2fa check 2nd factor during login
 */
app.post('/login/2fa', authenticateJWT, (req, res) => {
    if (req.user.twofa_passed) {
        res.status(400).json({ error: 1, message: '2nd factor already passed'});
        return;
    }

    if (!req.body || !req.body.otp) {
        res.status(400).json({ error: 2, message: 'missing required fields'});
        return;
    }

    dbPool.query('select twofa_secret from users where user_id = $1', [req.user.user_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 3, message: 'Internal server error'});
        } else {
            if (result.rows[0].twofa_secret === null) {
                res.status(400).json({error: 4, message: '2nd factor not enabled'});
                return;
            }

            const verified = speakeasy.totp.verify({
                secret: result.rows[0].twofa_secret,
                encoding: 'base32',
                token: req.body.otp
            });

            if (verified) {
                res.status(200).json({ token: jwt.sign({ username: req.user.username, user_id: req.user.user_id, twofa_passed: true }, jwtSecret)});
            } else {
                res.status(401).json({ error: 5, message: 'Invalid code'});
            }
        }
    });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

function respondWithError(responceObj, httpCode, code, message) {
    responceObj.status(httpCode).json(getJsonForError(code, message));
}

function getJsonForError(code, message) {
    return { error: code, message };
}
import express from 'express';
import dotenv from 'dotenv';

import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

import { dbPool } from './services/db.service.js';

import authenticateJWT from './middlewares/authenticate.middleware.js';

import userRoutes from './routes/user.routes.js';
import biometricsRegisterRoutes from './routes/biometrics.register.routes.js';
import biometricsLoginRoutes from './routes/biometrics.login.routes.js';
import communitiesRoutes from './routes/communities.routes.js';
import moderatorsRoutes from './routes/moderators.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import postsRoutes from './routes/posts.routes.js';
import postVotesRoutes from './routes/post.votes.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import commentVotesRoutes from './routes/comment.votes.routes.js';
import passwordLoginRoutes from './routes/password.login.routes.js';
import accountRoutes from './routes/account.routes.js';
import wiliPagesRoutes from './routes/wiki.pages.routes.js';

import handleErrors from './middlewares/error.handler.middleware.js';


/*
  Initial configuration
 */
dotenv.config();

/*
  Environment variables 
 */
const passwordPepper = process.env.PASSWORD_PEPPER;
const jwtSecret = process.env.JWT_SECRET;
const webauthnClientOrigin = process.env.WEBAUTHN_CLIENT_ORIGIN;

export { passwordPepper, jwtSecret, webauthnClientOrigin };


//export const dbPool = new Pool(); // uses process.env.PG* variables by default
// TODO: create a new "backend" user in db with limited permissions


const app = express();
const port = process.env.APP_PORT;

app.use(bodyParser.json());

/*
  Routes
*/
app.use("/users", userRoutes);

app.use('/biometrics/register', biometricsRegisterRoutes);
app.use('/biometrics/login', biometricsLoginRoutes);

app.use('/communities', communitiesRoutes);
app.use('/moderators', moderatorsRoutes);

app.use('/categories', categoriesRoutes);

app.use('/posts', postsRoutes);
app.use('/post-votes', postVotesRoutes);

app.use('/comments', commentsRoutes);
app.use('/comment-votes', commentVotesRoutes);

app.use('/login', passwordLoginRoutes);

app.use('/account', accountRoutes);

app.use('/wiki-pages', wiliPagesRoutes);



/*
 * Error handling
*/
app.use(handleErrors);

/*
  Endpoints
 */


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
    if (req.user.twofa_enabled && req.user.twofa_passed) {
        respondWithError(res, 400, 1, '2nd factor already enabled');
        return;
    }

    if (!req.body || !req.body.otp) {
        respondWithError(res, 400, 2, 'missing required fields');
        return;
    }

    const otp = req.body.otp;

    dbPool.query('select twofa_secret from users where user_id = $1', [req.user.user_id], (err, result) => {
        if (err) {
            console.error(err);
            respondWithError(res, 500, 3, 'Internal server error');
            return;
        } else {
            if (result.rows[0].twofa_secret === null) {
                respondWithError(res, 400, 4, '2nd factor not enabled');
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
                        respondWithError(res, 500, 5, 'Internal server error');
                    }
                });

                res.status(200).json({ token: jwt.sign({ 
                    username: req.user.username, 
                    user_id: req.user.user_id, 
                    twofa_enabled: true,
                    twofa_passed: true }, jwtSecret)});

                return;
            } else {
                respondWithError(res, 401, 6, 'Invalid code');
                return;
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
                res.status(200).json({ token: jwt.sign({ username: req.user.username, user_id: req.user.user_id, twofa_passed: true, twofa_enabled: true }, jwtSecret)});
            } else {
                res.status(401).json({ error: 5, message: 'Invalid code'});
            }
        }
    });
});



/**
 * @api {get} /verifytoken Check if JWT token has correct signature
 **/
app.get('/verifytoken', authenticateJWT, (req, res) => {
    // token is valid if it passes the middleware
    res.status(200).json({ valid: true });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

function respondWithError(responceObj, httpCode, code, message) {
    responceObj.status(httpCode).json(getJsonForError(code, message));
}

function getJsonForError(code, message) {
    return { error: code, message };
}
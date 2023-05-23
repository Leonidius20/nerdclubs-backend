import { dbPool } from '../services/db.service.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { encode } from 'base64-arraybuffer';
import crypto from 'crypto';

import { passwordPepper, jwtSecret } from '../app.js';

export default {
    get,
    create,
    //update,
    //remove
};


async function get(req, res) {
    try {
        const result = await dbPool.query('select * from users');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 1, message: 'Internal server error'});
    }
}

async function create(req, res) {
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

    // generate webauthn_user_id
    const webauthn_user_id = encode(crypto.randomBytes(32));

    try {
        const result = await dbPool.query('insert into users (username, password_hash, email, webauthn_user_id) values ($1, $2, $3, $4) returning user_id', [username, hash, email, webauthn_user_id]);
        const user_id = result.rows[0].user_id;

        res.status(200).json({
                token: jwt.sign({ 
                    username, 
                    user_id, 
                    twofa_enabled: false,
                    twofa_passed: true 
                }, jwtSecret)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 6, message: `Unable to create user: db says ${err}`});
    }
}
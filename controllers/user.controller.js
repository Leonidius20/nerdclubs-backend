import { dbPool } from '../services/db.service.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { encode } from 'base64-arraybuffer';
import crypto from 'crypto';

import { passwordPepper, jwtSecret } from '../app.js';
import firstRowOrThrow from '../utils/firstRowOrThrow.js';

export default {
    get,
    create,
    getById,
    getBannedUsers,
    banUser,
    unbanUser,
    //update,
    //remove
};


async function get(req, res, next) {
    const username = req.query.username;

    try {
        const result = await dbPool.query('select user_id, username, email, created_at from users where username = $1', [username]);
        res.status(200).json(firstRowOrThrow(result));
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    const { username, password, email } = req.body;

    if (username.length < 3 || username.length > 20) {
        throw new Error('Username must be between 3 and 20 characters');
    }

    if (password.length < 8 || password.length > 20) {
        throw new Error('Password must be between 8 and 20 characters');
    }

    if (!email.includes('@')) { // todo: replace with regex
        throw new Error('Invalid email address (does not match pattern)');
    }

    try {
        const hash = await argon2.hash(password + passwordPepper);
        const webauthn_user_id = encode(crypto.randomBytes(32));

        const result = await dbPool.query('insert into users (username, password_hash, email, webauthn_user_id) values ($1, $2, $3, $4) returning user_id', [username, hash, email, webauthn_user_id]);
        const user_id = result.rows[0].user_id;

        res.status(200).json({
                token: jwt.sign({ 
                    username, 
                    user_id, 
                    twofa_enabled: false,
                    twofa_passed: true,
                    privilege_level: 1
                }, jwtSecret)
        });
    } catch (err) {
        if (err.code === '23505') {
            next(new Error('Username or email already exists'));
        }
        next(err);
    }
}

async function getById(req, res, next) {
    const user_id = req.params.id;

    try {
        const result = await dbPool.query('select user_id, username, email, created_at from users where user_id = $1', [user_id]);
        res.status(200).json(firstRowOrThrow(result));
    } catch (err) {
        next(err);
    }
}

async function getBannedUsers(req, res, next) {
    try {
        const result = await dbPool.query('select user_id, username, email, created_at from users where is_banned IS True');
        res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
}

async function banUser(req, res, next) {
    const user_id = req.params.id;

    try {
        const result = await dbPool.query('update users set is_banned = True where user_id = $1', [user_id]);
        res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
}

async function unbanUser(req, res, next) {
    const user_id = req.params.id;

    try {
        await dbPool.query('update users set is_banned = False where user_id = $1', [user_id]);
        res.status(200).json({ success: 1 });
    } catch (err) {
        next(err);
    }
}
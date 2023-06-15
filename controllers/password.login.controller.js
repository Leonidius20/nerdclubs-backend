import { dbPool } from "../services/db.service.js";
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { jwtSecret, passwordPepper } from '../app.js';

export default {   
    login,
};

async function login(req, res, next) {
    const { username, password } = req.body;

    dbPool.query('select password_hash, user_id, twofa_secret, privilege_level, is_banned from users where username = $1', [username], async (err, result) => {
        if (err) {
            next(err);
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
                const privilege_level = result.rows[0].privilege_level;
                const is_banned = result.rows[0].is_banned;

                res.status(200).json({
                    token: jwt.sign({ username, user_id, twofa_enabled: twoFactorRequired, twofa_passed: !twoFactorRequired, privilege_level, is_banned }, jwtSecret)
                });
            } else {
                res.status(401).json({ error: 2, message: 'Invalid username or password'});
            }
        }
    });
}
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../app.js';

export default function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({error: -1, message: 'Invalid token', valid: false});
            }

            req.user = user;
            next();
        });
    } else {
        res.status(401).json({error: -1, message: 'Missing authorization header', valid: false});
    }
}
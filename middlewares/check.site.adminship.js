import { dbPool } from "../services/db.service.js";
import firstRowOrThrow from "../utils/firstRowOrThrow.js";

export default function checkSiteAdminship(req, res, next) {
    const { user_id } = req.user;

    dbPool.query('SELECT privilege_level FROM users WHERE user_id = $1', [user_id], (err, result) => {
        if (err) {
            next(err);
        }

        const user = firstRowOrThrow(result);

        if (user.privilege_level !== 2) {
            return res.status(403).json({ error: 3, message: 'Unauthorized - not a site admin' });
        }

        next();
    });
}
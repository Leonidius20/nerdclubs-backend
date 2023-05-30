import firstRowOrThrow from "../utils/firstRowOrThrow.js";
import { dbPool } from "../services/db.service.js";

export default {
    getUserDataFromToken,
};

async function getUserDataFromToken(req, res, next) {
    const user_id = req.user.user_id;

    try {
        const result = await dbPool.query(`select username, email, privilege_level, created_at, CASE WHEN webauthn_public_key IS NOT NULL
                                        THEN true
                                        ELSE false END AS biometric_enabled from users where user_id = $1`, [user_id]);
        res.json(firstRowOrThrow(result));
    } catch (err) {
        next(err);
    }
}
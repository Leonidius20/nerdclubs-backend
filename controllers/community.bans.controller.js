import { dbPool } from "../services/db.service.js";

export default {
    getAllBannedUsersInCommunity,
    banUserInCommunity,
    unbanUserInCommunity,
}

async function getAllBannedUsersInCommunity(req, res, next) {
    const { community_id } = req.body;

    try {
        const { rows } = await dbPool.query(
            'SELECT u.user_id, u.username FROM community_bans cb LEFT JOIN users u ON cb.user_id = u.user_id WHERE cb.community_id = $1',
            [community_id]
        );
            
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
}


async function banUserInCommunity(req, res, next) {
    const { community_id, user_id } = req.body;
    

    try {
        await dbPool.query(
            'INSERT INTO community_bans (community_id, user_id) VALUES ($1, $2) RETURNING 1',
            [community_id, user_id]
        );

        res.status(200).json({ success: 1 });
    } catch (error) {
        next(error);
    }
}

async function unbanUserInCommunity(req, res, next) {
    const { community_id, user_id } = req.body;

    try {
        await dbPool.query(
            'DELETE FROM community_bans WHERE community_id = $1 AND user_id = $2 RETURNING 1',
            [community_id, user_id]
        );

        res.status(200).json({ success: 1 });
    } catch (error) {
        next(error);
    }
}
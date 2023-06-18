import { dbPool } from "../services/db.service.js";

export default {
    getAllBannedUsersInCommunity,
    banUserInCommunity,
    unbanUserInCommunity,
}

async function getAllBannedUsersInCommunity(req, res, next) {
    const { community_id } = req.body;

    let { page } = req.query;

    if (!page) {
        page = 1;
    }

    const pageSize = 10; 
    const offset = (page - 1) * pageSize;

    try {
        const { rows } = await dbPool.query(
            'SELECT u.user_id, u.username, count(*) OVER() AS full_results_count FROM community_bans cb LEFT JOIN users u ON cb.user_id = u.user_id WHERE cb.community_id = $1 ORDER BY username LIMIT $2 OFFSET $3',
            [community_id, pageSize, offset]
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
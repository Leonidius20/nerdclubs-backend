import { dbPool } from "../services/db.service.js";

export default function checkCommunityModeratorship(req, res, next) {
    // check whether user + community are in moderators table

    const { user } = req;
    const { community_id } = req.body;
    if (!community_id) {
        return res.status(400).json({ error: 1, message: 'Missing required fields (community_id)' });
    }
    if (!user) {
        return res.status(401).json({ error: 2, message: 'Unauthorized' });
    }

    // check if owner
    dbPool.query('SELECT owner_user_id FROM communities WHERE community_id = $1', [community_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 3, message: 'Internal server error' });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 4, message: 'Community not found' });
        }

        if (result.rows[0].owner_user_id === user.user_id) {
            next();
            return;
        }

        // check if exists in moderators table record with user_id and community_id
        dbPool.query('SELECT * FROM moderators WHERE user_id = $1 AND community_id = $2', [user.user_id, community_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 3, message: 'Internal server error' });
            }

            if (result.rows.length === 0) {
                return res.status(403).json({ error: 4, message: 'Forbidden' });
            }

            next();
        });
    });
}

export function isUserAModeratorInCommnuity(community_id, user_id, callback) {
    // check if owner
    dbPool.query('SELECT owner_user_id FROM communities WHERE community_id = $1', [community_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 3, message: 'Internal server error' });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 4, message: 'Community not found' });
        }

        if (result.rows[0].owner_user_id === user.user_id) {
            next();
            return;
        }

        // check if exists in moderators table record with user_id and community_id
        dbPool.query('SELECT * FROM moderators WHERE user_id = $1 AND community_id = $2', [user.user_id, community_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 3, message: 'Internal server error' });
            }

            if (result.rows.length === 0) {
                return res.status(403).json({ error: 4, message: 'Forbidden' });
            }

            next();
        });
    });
}
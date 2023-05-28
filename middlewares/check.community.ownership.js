import { dbPool } from "../services/db.service.js";

export default function checkCommunityOwnership(req, res, next) {
    const user = req.user;
    const community_id = req.body.community_id;

    
    if (!community_id) {
        return res.status(400).json({ error: 1, message: 'Missing required fields (community_id) for ownership check' });
    }
    if (!user) {
        return res.status(401).json({ error: 2, message: 'Missing header (ownership check)' });
    }

    // get community owner (owner_user_id) from database
    // compare with user.user_id
    // if they are not the same, return 403 Forbidden
    dbPool.query('SELECT owner_user_id FROM communities WHERE community_id = $1', [community_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 3, message: 'Internal server error' });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 4, message: 'Community not found' });
        }

        const community = result.rows[0];
        if (community.owner_user_id !== user.user_id) {
            return res.status(403).json({ error: 5, message: 'Unauthorized - not a community owner' });
        }

        next();
    });
}
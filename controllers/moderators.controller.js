import { dbPool } from "../services/db.service.js";

export default {
    add,
    getAllInCommunity,
    remove,
    makeOwner,
}

async function add(req, res, next) {
    const { user_id, community_id } = req.body;

    try {
        await dbPool.query(
            'INSERT INTO moderators (user_id, community_id) VALUES ($1, $2) on conflict (user_id, community_id) do nothing',
            [user_id, community_id]
        );

        res.status(201).json({ "success" : true });
    } catch (error) {
        next(error);
    }
}

async function getAllInCommunity(req, res, next) {
    const community_url = /*req.params.url*/ req.query.community_url;

    try {
        const { rows } = await dbPool.query(
            'SELECT moderators.*, users.username FROM moderators left join users using(user_id) WHERE community_id = (SELECT community_id from communities WHERE url = $1)',
            [community_url]
        );

        /*if (rows.length === 0) {
            return res.status(404).json({ error: 2, message: 'Community not found' });
        }*/

        const moderators = rows;

        res.status(200).json({
            community_url,
            moderators,
        });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    const { user_id, community_id } = req.body;

    try {
        await dbPool.query(
            'DELETE FROM moderators WHERE user_id = $1 AND community_id = $2',
            [user_id, community_id]
        );

        res.status(200).json({ "success" : true });
    } catch (error) {
        next(error);
    }
}

async function makeOwner(req, res, next) {
    const { user_id, community_id } = req.body;

    try {
        await dbPool.query(
            'UPDATE communities SET owner_user_id = $1 WHERE community_id = $2',
            [user_id, community_id]
        );

        await dbPool.query(
            'DELETE FROM moderators WHERE user_id = $1 AND community_id = $2',
            [user_id, community_id]
        );

        const myUserId = req.user.user_id;

        await dbPool.query(
            'INSERT INTO moderators (user_id, community_id) VALUES ($1, $2)',
            [myUserId, community_id]
        );

        res.status(200).json({ "success" : true });
    } catch (error) {
        next(error);
    }
}
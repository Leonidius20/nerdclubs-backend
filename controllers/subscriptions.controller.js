import { dbPool } from '../services/db.service.js';

export default {
    getSubscribedCommunities,
    subscribe,
    getSubscribedPosts,
    unsubscribe,
};

async function getSubscribedCommunities(req, res, next) {
    const { user_id } = req.user;

    try {
        const { rows } = await dbPool.query(
            `SELECT communities.community_id, communities.name, communities.description, communities.url
            FROM subscriptions
            INNER JOIN communities ON communities.community_id = subscriptions.community_id
            WHERE subscriptions.user_id = $1`,
            [user_id]
        );

        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
}

async function subscribe(req, res, next) {
    const { user_id } = req.user;
    const { community_id } = req.body;

    try {
        await dbPool.query(
            `INSERT INTO subscriptions (user_id, community_id)
            VALUES ($1, $2)`,
            [user_id, community_id]
        );

        res.status(200).json({ success: 1 });
    } catch (error) {
        next(error);
    }
}

async function getSubscribedPosts(req, res, next) {
    const { user_id } = req.user;

    let { page } = req.query;

    if (!page) {
        page = 1;
    }

    const pageSize = 10; 
    const offset = (page - 1) * pageSize;

    try {
        const { rows } = await dbPool.query(
            `SELECT posts.post_id, posts.title, posts.content, posts.created_at, posts.community_id, posts.category_id, communities.url, communities.name as community_name, count(*) OVER() AS full_results_count
            FROM subscriptions
            INNER JOIN posts ON posts.community_id = subscriptions.community_id
            LEFT JOIN communities ON communities.community_id = posts.community_id
            WHERE subscriptions.user_id = $1 ORDER BY posts.created_at DESC LIMIT $2 OFFSET $3`,
            [user_id, pageSize, offset]
        );

        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
}

async function unsubscribe(req, res, next) {
    const { user_id } = req.user;
    const { community_id } = req.body;

    try {
        await dbPool.query(
            `DELETE FROM subscriptions
            WHERE user_id = $1 AND community_id = $2`,
            [user_id, community_id]
        );

        res.status(200).json({ success: 1 });
    } catch (error) {
        next(error);
    }
}
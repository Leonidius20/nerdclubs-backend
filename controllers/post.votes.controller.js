import { dbPool } from "../services/db.service.js";

export default {
    voteForPost,
    getVotesForPost,
    getMyVoteForPost,
};

async function voteForPost(req, res) {
    const user_id = req.user.user_id;

    const { post_id, is_positive } = req.body;

    if (post_id == null || is_positive == null) {
        res.status(400).json({error: 1, message: 'Missing post_id or is_positive'});
        return;
    }

    try {
        const result = await dbPool.query('insert into post_votes (post_id, user_id, is_positive) values ($1, $2, $3) on conflict (post_id, user_id) do update set is_positive = $3', [post_id, user_id, is_positive]);
        res.json({success: true});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 2, message: 'Internal server error'});
        return;
    }
}

async function getVotesForPost(req, res) {
    const post_id = req.params.post_id;

    if (!post_id) {
        res.status(400).json({error: 1, message: 'Missing post_id'});
        return;
    }

    try {
        const result = await dbPool.query('select COALESCE(sum(CASE WHEN is_positive THEN 1 ELSE -1 END),0) as rating from post_votes where post_id = $1', [post_id]);
        if (result.rows.length == 0) {
            res.status(404).json({error: 3, message: 'Post not found'});
            return;
        }
        res.json(result.rows[0]); // {rating: 0}
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 2, message: 'Internal server error'});
        return;
    }
}

async function getMyVoteForPost(req, res) {
    const user_id = req.user.user_id;
    const post_id = req.params.post_id;

    if (!post_id) {
        res.status(400).json({error: 1, message: 'Missing post_id'});
        return;
    }

    try {
        const result = await dbPool.query('select is_positive from post_votes where post_id = $1 and user_id = $2', [post_id, user_id]);
        if (result.rows.length == 0) {
            res.json({i_voted: false, is_positive: null})
            return;
        }
        res.json({ i_voted: true, is_positive:  result.rows[0].is_positive}); // {is_positive: true}
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 2, message: 'Internal server error'});
        return;
    }
}
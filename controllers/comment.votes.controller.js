import { dbPool } from "../services/db.service.js";

export default {
    voteForComment,
    getVotesForComment,
    getMyVoteForComment,
};

async function voteForComment(req, res) {
    const user_id = req.user.user_id;

    const { comment_id, is_positive } = req.body;

    if (comment_id == null || is_positive == null) {
        res.status(400).json({error: 1, message: 'Missing comment_id or is_positive'});
        return;
    }

    try {
        const result = await dbPool.query('insert into comment_votes (comment_id, user_id, is_positive) values ($1, $2, $3) on conflict (comment_id, user_id) do update set is_positive = $3', [comment_id, user_id, is_positive]);
        res.json({success: true});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 2, message: 'Internal server error'});
        return;
    }
}

async function getVotesForComment(req, res) {
    const comment_id = req.params.comment_id;

    if (!comment_id) {
        res.status(400).json({error: 1, message: 'Missing comment_id'});
        return;
    }

    try {
        const result = await dbPool.query('select COALESCE(sum(CASE WHEN is_positive THEN 1 ELSE -1 END),0) as rating from comment_votes where comment_id = $1', [comment_id]);
        if (result.rows.length == 0) {
            res.status(404).json({error: 3, message: 'Comment not found'});
            return;
        }
        res.json(result.rows[0]); // {rating: 0}
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 2, message: 'Internal server error'});
        return;
    }
}

async function getMyVoteForComment(req, res) {
    const user_id = req.user.user_id;
    const comment_id = req.params.comment_id;

    if (!comment_id) {
        res.status(400).json({error: 1, message: 'Missing comment_id'});
        return;
    }

    try {
        const result = await dbPool.query('select is_positive from comment_votes where comment_id = $1 and user_id = $2', [comment_id, user_id]);
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
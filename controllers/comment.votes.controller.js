import { dbPool } from "../services/db.service.js";
import firstRowOrThrow from "../utils/firstRowOrThrow.js";

export default {
    voteForComment,
    getVotesForComment,
    getMyVoteForComment,
};

async function voteForComment(req, res, next) {
    const user_id = req.user.user_id;

    const { comment_id, is_positive } = req.body;

    try {
        await dbPool.query('insert into comment_votes (comment_id, user_id, is_positive) values ($1, $2, $3) on conflict (comment_id, user_id) do update set is_positive = $3', [comment_id, user_id, is_positive]);
        res.json({success: true});
    } catch (err) {
        next(err);
    }
}

async function getVotesForComment(req, res, next) {
    const comment_id = req.params.comment_id;

    if (!comment_id) {
        res.status(400).json({error: 1, message: 'Missing comment_id'});
        return;
    }

    try {
        const result = await dbPool.query('select COALESCE(sum(CASE WHEN is_positive THEN 1 ELSE -1 END),0) as rating from comment_votes where comment_id = $1', [comment_id]);
        res.json(firstRowOrThrow(result)); 
    } catch (err) {
        next(err);
    }
}

async function getMyVoteForComment(req, res, next) {
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
        next(err);
    }
}
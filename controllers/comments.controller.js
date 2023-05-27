import { dbPool } from "../services/db.service.js";

export default {
    getAllForPost,
    create,
};

async function getAllForPost(req, res) {
    const { post_id } = req.params;
    if (!post_id) {
        return res.status(400).json({ error: 1, message: 'Missing required fields (post_id)' });
    }

    try {
        let result = null;
        if (req.user) {
            const user_id = req.user.user_id;

            const query = `
            SELECT c.*,
                users.username,
                COALESCE(upvotes.upvote_count, 0) - COALESCE(downvotes.downvote_count, 0) AS rating,
                CASE
                    WHEN cv.is_positive IS NOT NULL THEN TRUE
                ELSE FALSE
            END AS i_voted,
            cv.is_positive AS is_my_vote_positive
            FROM comments c
                left join users on c.author_user_id = users.user_id
            LEFT JOIN (
            SELECT comment_id, COUNT(*) AS upvote_count
            FROM comment_votes
            WHERE is_positive = true
            GROUP BY comment_id
            ) upvotes ON c.comment_id = upvotes.comment_id
            LEFT JOIN (
            SELECT comment_id, COUNT(*) AS downvote_count
            FROM comment_votes
            WHERE is_positive = false
            GROUP BY comment_id
            ) downvotes ON c.comment_id = downvotes.comment_id
            LEFT JOIN (
            SELECT
                comment_id,
                is_positive
            FROM
                comment_votes
            WHERE
                user_id = $1
            ) cv ON c.comment_id = cv.comment_id
            WHERE post_id = $2 ORDER BY created_at ASC;
            
            `;

            result = await dbPool.query(
                query,
                [user_id, post_id]
            );
        } else {
            const query = `
            SELECT c.*, COALESCE(upvotes.upvote_count, 0) - COALESCE(downvotes.downvote_count, 0) AS rating
                FROM comments c
                LEFT JOIN (
                SELECT comment_id, COUNT(*) AS upvote_count
                FROM comment_votes
                WHERE is_positive = true
                GROUP BY comment_id
                ) upvotes ON c.comment_id = upvotes.comment_id
                LEFT JOIN (
                SELECT comment_id, COUNT(*) AS downvote_count
                FROM comment_votes
                WHERE is_positive = false
                GROUP BY comment_id
                ) downvotes ON c.comment_id = downvotes.comment_id
                WHERE post_id = $1 ORDER BY created_at ASC;
            
            `;

            result = await dbPool.query(
                query,
                [post_id]
            );

        }

        const comments = result.rows;

        // map comment_id to comment
        const commentsMap = {};
        comments.forEach(async comment => {
            
            

            commentsMap[comment.comment_id] = comment;
            
        });

        // loop through the array backwards and add children to their parents. delete the child from the array
        for (let i = comments.length - 1; i >= 0; i--) {
            const comment = comments[i];
            if (comment.parent_comment_id) {
                const parentComment = commentsMap[comment.parent_comment_id];
                if (parentComment) {
                    if (!parentComment.children) {
                        parentComment.children = [];
                    }
                    parentComment.children.push(comment);
                    comments.splice(i, 1);
                } else {
                    throw new Error(`Parent comment with id ${comment.parent_comment_id} not found for child with id ${comment.comment_id}`);
                }

            }
        }

        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 3, message: 'Internal server error' });
    }
}

async function create(req, res) {
    const user_id = req.user.user_id;

    const { post_id, content, parent_comment_id } = req.body;
    if (!post_id || !content) {
        return res.status(400).json({ error: 1, message: 'Missing required fields (post_id, content)' });
    }

    if (!user_id) {
        return res.status(400).json({ error: 2, message: 'invalid token - Missing required fields (user_id)' });
    }

    try {
        const { rows } = await dbPool.query(
            'INSERT INTO comments (post_id, author_user_id, content, parent_comment_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [post_id, user_id, content, parent_comment_id]
        );

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 3, message: 'Internal server error' });
    }
}


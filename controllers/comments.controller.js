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
        const { rows } = await dbPool.query(
            'SELECT comments.*, users.username as author_username FROM comments left join users on comments.author_user_id = users.user_id  WHERE post_id = $1 ORDER BY created_at ASC',
            [post_id]
        );

        const comments = rows;
        
        // map comment_id to comment
        const commentsMap = {};
        comments.forEach(comment => {
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


import { dbPool } from "../services/db.service.js";
import firstRowOrThrow from "../utils/firstRowOrThrow.js";

export default {
    getInCategory,
    create,
    getPostById,
    //update,
    remove,
};

async function getInCategory(req, res, next) {
    let { category_id, page } = req.query;

    if (!page) {
        page = 1;
    }

    const pageSize = 10; 
    const offset = (page - 1) * pageSize;

    try {
        const result = await dbPool.query('select posts.*, users.username, count(*) OVER() AS full_results_count from posts left join users on posts.author_user_id = users.user_id where category_id = $1 ORDER BY posts.created_at ASC LIMIT $2 OFFSET $3', 
        [category_id, pageSize, offset]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    const user_id = req.user.user_id;
   
    const { category_id, title, content } = req.body;

    try {
        const result = await dbPool.query('select * from categories where category_id = $1', [category_id]);

        if (result.rows.length === 0) {
            throw new Error('Invalid category_id');
        } 

        const community_id = result.rows[0].community_id;

        const result2 = await dbPool.query('insert into posts (author_user_id, category_id, community_id, title, content) values ($1, $2, $3, $4, $5)  returning post_id', [user_id, category_id, community_id, title, content]);

        res.json(result2.rows[0]);
    } catch (err) {
        next(err);
    }
}

async function getPostById(req, res, next) {
    const post_id = req.params.id;

    if (!post_id) {
        // impossilbe to reach this, i think
        res.status(400).json({error: 1, message: 'Missing post_id'});
        return;
    }

    try {
        const result = await dbPool.query('select posts.*, users.username from posts left join users on posts.author_user_id = users.user_id where post_id = $1', [post_id]);
        const post = firstRowOrThrow(result);

        if (req.user && req.user.user_id === post.author_user_id) {
            post.is_author = true;
        } else {
            post.is_author = false;
        }

        res.json(post);
    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    const post_id = req.params.id;

    if (!post_id) {
        // impossilbe to reach probably
        res.status(400).json({error: 1, message: 'Missing post_id'});
        return;
    }

    try {
        const result = await dbPool.query('select community_id from posts where post_id = $1', [post_id]);
        const { community_id } = firstRowOrThrow(result);

        let authorized = false;

        // check if owner
        const result2 = await dbPool.query('select owner_user_id from communities where community_id = $1', [community_id]);
        const { owner_user_id } = firstRowOrThrow(result2);
        if (req.user && req.user.user_id === owner_user_id) {
            authorized = true;
        } else {
            // check if moderator
            const result3 = await dbPool.query('select * from moderators where community_id = $1 and user_id = $2', [community_id, req.user.user_id]);
            if (result3.rows.length > 0) {
                authorized = true;
            }
        }

        if (!authorized) {
            res.status(403).json({error: 1, message: 'You are not authorized to delete this post'});
            return;
        }

        await dbPool.query('delete from posts where post_id = $1', [post_id]);

        res.json({success: 1, message: 'Post deleted'});
    } catch (err) {
        next(err);
    }
}
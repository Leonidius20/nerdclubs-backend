import { dbPool } from "../services/db.service.js";
import firstRowOrThrow from "../utils/firstRowOrThrow.js";

export default {
    getInCategory,
    create,
    getPostById,
    //update,
    //remove
};

async function getInCategory(req, res, next) {
    const category_id = req.query.category_id;

    try {
        const result = await dbPool.query('select posts.*, users.username from posts left join users on posts.author_user_id = users.user_id where category_id = $1', [category_id]);
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
        res.json(firstRowOrThrow(result));
    } catch (err) {
        next(err);
    }
}
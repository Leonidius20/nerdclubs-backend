import { dbPool } from "../services/db.service.js";

export default {
    getInCategory,
    create,
    getPostById,
    //update,
    //remove
};

async function getInCategory(req, res) {
    const category_id = req.query.category_id;

    if (!category_id) {
        res.status(400).json({error: 1, message: 'Missing category_id'});
        return;
    }

    try {
        const result = await dbPool.query('select * from posts where category_id = $1', [category_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 2, message: 'Internal server error'});
        return;
    }
}

async function create(req, res) {
    const user_id = req.user.user_id;
   
    const { category_id, title, content } = req.body;

    if (!category_id || !title || !content) {
        res.status(400).json({error: 1, message: 'Missing required fields (category_id, title, content)'});
        return;
    }

    try {
        // find which community the category belongs to
        const result = await dbPool.query('select community_id from categories where category_id = $1', [category_id]);
        const community_id = result.rows[0].community_id;

        console.log("community_id: " + community_id);

        const result2 = await dbPool.query('insert into posts (author_user_id, category_id, community_id, title, content) values ($1, $2, $3, $4, $5) returning post_id', [user_id, category_id, community_id, title, content]);
        res.json(result2.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 1, message: `Internal server error: ${err.message}`});
        return;
    }
}

async function getPostById(req, res) {
    const post_id = req.params.id;

    if (!post_id) {
        res.status(400).json({error: 1, message: 'Missing post_id'});
        return;
    }

    try {
        const result = await dbPool.query('select * from posts where post_id = $1', [post_id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 2, message: 'Internal server error'});
        return;
    }
}
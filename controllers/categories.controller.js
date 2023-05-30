import { dbPool } from '../services/db.service.js';
import firstRowOrThrow from '../utils/firstRowOrThrow.js';

export default {
    getById,
    create,
    getAllInCommunity,
    //update,
    //remove
};

async function getById(req, res, next) {
    const { id } = req.params;
    if (!id) {
        // it is probably impossible to get here, but just in case
        return res.status(400).json({ error: 1, message: 'Missing required fields (id)' });
    }

    try {
        const result = await dbPool.query(
            'SELECT * FROM categories WHERE category_id = $1',
            [id]
        );

        const category = firstRowOrThrow(result);

        res.status(200).json({
            id: category.category_id,
            name: category.name,
            description: category.description,
            community_id: category.community_id,
        });
    } catch (error) {
        next(error);
    }
}

async function getAllInCommunity(req, res, next) {
    // paged search. If no page is specified, it will return the first page
    // If no seach query is specified, it will return all categories
    let { community_id } = req.query;

    try {
        const { rows } = await dbPool.query(
            'SELECT * FROM categories WHERE community_id = $1',
            [community_id]
        );

        res.status(200).json(rows.map(category => ({
            id: category.category_id,
            name: category.name,
            description: category.description,
            community_id: category.community_id,
        })));
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    let { name, description, community_id } = req.body;
    
    if (!description) {
        description = '';
    }

    try {
        const { rows } = await dbPool.query(
            'INSERT INTO categories (name, description, community_id) VALUES ($1, $2, $3) RETURNING category_id',
            [name, description, community_id]
        );

        res.status(201).json({ id: rows[0].category_id });
    } catch (error) {
        next(error);
    }
}
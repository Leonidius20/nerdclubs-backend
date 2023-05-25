import { dbPool } from '../services/db.service.js';

export default {
    getById,
    create,
    getAllInCommunity,
    //update,
    //remove
};

async function getById(req, res) {
    const { id } = req.params;
    if (!id) {
        // it is probably impossible to get here, but just in case
        return res.status(400).json({ error: 1, message: 'Missing required fields (id)' });
    }

    try {
        const { rows } = await dbPool.query(
            'SELECT * FROM categories WHERE category_id = $1',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 2, message: 'Category not found' });
        }

        const category = rows[0];

        res.status(200).json({
            id: category.category_id,
            name: category.name,
            description: category.description,
            community_id: category.community_id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 3, message: 'Internal server error' });
    }
}

async function getAllInCommunity(req, res) {
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
        console.error(error);
        res.status(500).json({ error: 3, message: 'Internal server error' });
    }
}

async function create(req, res) {
    // todo check moderator permissions

    let { name, description, community_id } = req.body;
    if (!name || !community_id) {
        return res.status(400).json({ error: 1, message: 'Missing required fields (name, community_id)' });
    }
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
        console.error(error);
        res.status(500).json({ error: 2, message: 'Internal server error' });
    }
}
import e from 'express';
import { dbPool } from '../services/db.service.js';

export default {
    getByUrl,
    create,
    getAll,
    //update,
    //remove
};

async function getByUrl(req, res) {
    const { url } = req.params;
    if (!url) {
        // it is probably impossible to get here, but just in case
        return res.status(400).json({ error: 1, message: 'Missing required fields (url)' });
    }

    try {
        const { rows } = await dbPool.query(
            'SELECT community_id, name, description, url, owner_user_id FROM communities WHERE url = $1',
            [url]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 2, message: 'Community not found' });
        }

        const community = rows[0];

        // optionally check jwt token to see if user is owner of the community
        if (req.user && req.user.user_id === community.owner_user_id) {
            community.is_owner = true;
        }

        res.status(200).json({
            id: community.community_id,
            name: community.name,
            description: community.description,
            url: community.url,
            owner_user_id: community.owner_user_id,
            is_owner: community.is_owner,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 3, message: 'Internal server error' });
    }
}

async function getAll(req, res) {
    // paged search. If no page is specified, it will return the first page
    // If no seach query is specified, it will return all communities
    let { page, query } = req.query;

    if (!page) {
        page = 1;
    }

    const page_size = 10;
    const offset = (page - 1) * page_size;

    try {
        if (query) {
            query = query.toLowerCase();

            const { rows } = await dbPool.query(
                'SELECT community_id, name, description, url FROM communities WHERE LOWER(name) LIKE $1 ORDER BY community_id LIMIT $2 OFFSET $3',
                [`%${query}%`, page_size, offset]
            );

            res.status(200).json(rows);
        } else {
            const { rows } = await dbPool.query(
                'SELECT community_id, name, description, url FROM communities ORDER BY community_id LIMIT $1 OFFSET $2',
                [page_size, offset]
            );

            res.status(200).json(rows);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 1, message: 'Internal server error' });
    }
}

async function create(req, res) {
    const name = req.body.name;
    const description = req.body.description ?? '';
    const url = req.body.url;

    if (!name || !url) {
        return res.status(400).json({ error: 1, message: 'Missing required fields' });
    }

    const { user_id } = req.user;

    try {
        const { rows } = await dbPool.query(
            'INSERT INTO communities (name, description, url, owner_user_id) VALUES ($1, $2, $3, $4) RETURNING community_id, url',
            [name, description, url, user_id]
        );

        const community_id = rows[0].community_id;
        const community_url = rows[0].url;

        res.status(201).json({ id: community_id, url: community_url });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 3, message: 'Community with such a URL already exists' });
        } else {
            console.error(error);
            res.status(500).json({ error: 2, message: 'Internal server error' });
        }   
    }
}
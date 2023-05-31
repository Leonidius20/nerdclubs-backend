import { dbPool } from '../services/db.service.js';
import firstRowOrThrow from '../utils/firstRowOrThrow.js';

export default {
    create,
    getByUrl,
    update,
    getAllInCommunity,
}

async function create(req, res, next) {
    const { url, title, community_id, content } = req.body;

    const { user_id } = req.user;
    
    try {
        const result = await dbPool.query(
            `INSERT INTO wiki_pages (url, title, community_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
            [url, title, community_id, content]
        );

        const savedWikiPage = firstRowOrThrow(result);

        // save this version as the first version
        await dbPool.query(
            `INSERT INTO wiki_page_versions (wiki_page_id, title, content, last_editor_user_id) VALUES ($1, $2, $3, $4)`,
            [savedWikiPage.wiki_page_id, title, content, user_id]
        );

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

async function getByUrl(req, res, next) {
    const { community_id, url } = req.query;

    try {
        const result = await dbPool.query(
            `SELECT * FROM wiki_pages WHERE community_id = $1 AND url = $2`,
            [community_id, url]
        );

        res.json(firstRowOrThrow(result));
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    const { wiki_page_id, title, content } = req.body;

    const { user_id } = req.user;

    try {
        const result = await dbPool.query(
            `UPDATE wiki_pages SET title = $1, content = $2 WHERE wiki_page_id = $3 RETURNING *`,
            [title, content, wiki_page_id]
        );

        // save this version as the first version
        await dbPool.query(
            `INSERT INTO wiki_page_versions (wiki_page_id, title, content, last_editor_user_id) VALUES ($1, $2, $3, $4)`,
            [wiki_page_id, title, content, user_id]
        );

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

async function getAllInCommunity(req, res, next) {
    const { community_id } = req.query;

    try {
        const result = await dbPool.query(
            `SELECT * FROM wiki_pages WHERE community_id = $1`,
            [community_id]
        );

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
}
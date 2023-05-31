import { dbPool } from "../services/db.service.js";
import firstRowOrThrow from "../utils/firstRowOrThrow.js";

export default {
    getAllVersionsOfPage,
    getVersionById,
    rollbackTo,
}

async function getAllVersionsOfPage(req, res, next) {
    const { wiki_page_id } = req.query;

    try {
        const result = await dbPool.query(
            `SELECT wiki_page_versions.*, users.username as last_editor_username FROM wiki_page_versions left join users on wiki_page_versions.last_editor_user_id = users.user_id WHERE wiki_page_id = $1 order by last_modified desc`,
            [wiki_page_id]
        );

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
}

async function getVersionById(req, res, next) {
    const { wiki_page_version_id } = req.params;

    try {
        const result = await dbPool.query(
            `SELECT wiki_page_versions.*, users.username last_editor_username FROM wiki_page_versions left join users on wiki_page_versions.last_editor_user_id = users.user_id WHERE wiki_page_version_id = $1`,
            [wiki_page_version_id]
        );

        res.json(firstRowOrThrow(result));
    } catch (error) {
        next(error);
    }
}

async function rollbackTo(req, res, next) {
    const { wiki_page_version_id } = req.body;

    try {
        const result = await dbPool.query(
            `SELECT * FROM wiki_page_versions WHERE wiki_page_version_id = $1`,
            [wiki_page_version_id]
        );

        const version = firstRowOrThrow(result);

        // update wiki page with contents and title from saved version
        await dbPool.query(
            `UPDATE wiki_pages SET title = $1, content = $2 WHERE wiki_page_id = $3`,
            [version.title, version.content, version.wiki_page_id]
        );

        // delete all versions after the one we rolled back to
        // for some reason in deletes the one we rolled back to as well
        // so we have to reinsert it
        await dbPool.query(
            `DELETE FROM wiki_page_versions WHERE wiki_page_id = $1 AND last_modified > $2`,
            [version.wiki_page_id, version.last_modified]
        );

        await dbPool.query(
            `INSERT INTO wiki_page_versions (wiki_page_id, title, content, last_editor_user_id, last_modified) VALUES ($1, $2, $3, $4, $5)`,
            [version.wiki_page_id, version.title, version.content, version.last_editor_user_id, version.last_modified]
        );

        res.json({ success: 1 });
    } catch (error) {
        next(error);
    }
}
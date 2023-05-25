import { dbPool } from "../services/db.service.js";

export default {
    add,
    getAllInCommunity,
    remove,
}

async function add(req, res) {
    res.json({message: "well at least you are authenticated",
test: req.test
});
}

async function getAllInCommunity(req, res) {
    const community_url = /*req.params.url*/ req.query.community_url;
    if (!community_url) {
        return res.status(400).json({ error: 1, message: 'Missing required fields (community_url)' });
    }

    try {
        const { rows } = await dbPool.query(
            'SELECT * FROM moderators WHERE community_id = (SELECT community_id from communities WHERE url = $1)',
            [community_url]
        );

        /*if (rows.length === 0) {
            return res.status(404).json({ error: 2, message: 'Community not found' });
        }*/

        const moderators = rows;

        res.status(200).json({
            community_url,
            moderators,
            test: req.test,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 3, message: 'Internal server error' });
    }
}

async function remove(req, res) {
}
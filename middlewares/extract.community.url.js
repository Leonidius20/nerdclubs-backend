export default function extractCommunityUrl(req, res, next) {
    const { url } = req.params;
    if (!url) {
        return res.status(400).json({ error: 1, message: 'Missing required fields (url)' });
    }

    req.community_url = url;

    next();
}
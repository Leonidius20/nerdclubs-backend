export default function checkUrlParamsCurry(requiredParams) {
    return function checkUrlParams(req, res, next) {
        const missingParams = [];
        for (const param of requiredParams) {
            if (req.query[param] == null) {
                missingParams.push(param);
            }
        }

        if (missingParams.length > 0) {
            return res.status(400).json({ error: 1, message: `Missing required url params (${missingParams.join(', ')})` });
        }

        next();
    }
}
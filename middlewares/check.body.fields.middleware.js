

export default function checkBodyFieldsCurry(requiredFields) {
    return function checkBodyFields(req, res, next) {
        const missingFields = [];
        for (const field of requiredFields) {
            if (req.body[field] == null) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({ error: 1, message: `Missing required fields (${missingFields.join(', ')})` });
        }

        next();
    }
}
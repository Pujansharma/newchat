const jwt=require("jsonwebtoken");
const Auth = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const payload = jwt.verify(token, "masai");
        req.userId = payload.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};
module.exports={Auth}
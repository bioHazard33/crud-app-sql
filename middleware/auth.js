const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
    const token = req.header("Authorization").replace("Bearer ", "");
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).send({ data: null, error: "Invalid Token" });
    }
    req.id = parseInt(payload.id);
    next();
};

module.exports = auth;

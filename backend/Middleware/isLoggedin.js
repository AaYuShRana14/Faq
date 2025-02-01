const isLoggedin = (req, res, next) => {
    const jwt = require('jsonwebtoken');
    const jwtSecret='secret';
    if(req.headers.authorization===undefined){
        return res.status(401).json({error:"Unauthorized"});
    }
    const token = req.headers.authorization.split(' ')[1];
    if(!token){
        return res.status(401).json({error:"Unauthorized"});
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({error:"Unauthorized"});
    }
};
module.exports = isLoggedin;
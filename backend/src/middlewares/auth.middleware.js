import { verify } from 'jsonwebtoken';
import { findById } from '../models/user.model';


const authMiddleware = async (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({message: 'Unauthorized'});
    }
    token = token.split(' ')[1];
    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        req.user = await findById(decoded.userId);
        next();
    } catch (error) {
        res.status(401).json({message: 'Unauthorized'});
    }

    if (!token) {
        return res.status(401).json({message: 'Unauthorized'});
    }
    token = token.split(' ')[1];
    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        req.user = await findById(decoded.userId);
        next();
    } catch (error) {
        res.status(401).json({message: 'Unauthorized'});
    }
}

export default authMiddleware;

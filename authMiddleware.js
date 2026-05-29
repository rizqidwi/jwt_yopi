const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        logger.warn(`Security Warning: Protected route access attempt without token - ${req.method} ${req.path}`);
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            logger.warn(`Security Warning: Attempt to use expired token - ${req.method} ${req.path}`);
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.'
            });
        }
        logger.warn(`Security Warning: Invalid token attempt - ${req.method} ${req.path} - Error: ${error.message}`);
        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authMiddleware;
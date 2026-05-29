const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;
    
    // Cek apakah header ada
    if (!authHeader) {
        console.log('❌ No authorization header');
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    // Ambil token (format: "Bearer <token>")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
        console.log('❌ No token found');
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia123');
        req.user = decoded;
        console.log('✅ Token verified for user:', decoded.email);
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('❌ Token expired');
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.'
            });
        }
        console.log('❌ Invalid token:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authMiddleware;
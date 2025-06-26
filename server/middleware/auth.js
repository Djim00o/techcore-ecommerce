const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Admin authorization middleware
const adminAuth = [authMiddleware, authorize('admin')];

// Moderator or admin authorization middleware
const moderatorAuth = [authMiddleware, authorize('admin', 'moderator')];

// Account ownership verification middleware
const verifyOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    const resourceUserId = req.params.userId || req.body.userId;
    
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
    });
};

// Rate limiting bypass for authenticated users
const authRateLimit = (req, res, next) => {
    if (req.user) {
        // Authenticated users get higher rate limits
        req.rateLimit = {
            limit: req.user.role === 'admin' ? 1000 : 200,
            remaining: req.user.role === 'admin' ? 1000 : 200
        };
    }
    next();
};

module.exports = {
    authMiddleware,
    optionalAuth,
    authorize,
    adminAuth,
    moderatorAuth,
    verifyOwnership,
    authRateLimit
}; 
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error details
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = {
            statusCode: 404,
            message
        };
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = {
            statusCode: 400,
            message
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            statusCode: 400,
            message
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = {
            statusCode: 401,
            message
        };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = {
            statusCode: 401,
            message
        };
    }

    // Handle specific application errors
    if (err.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(err.errors).forEach(key => {
            validationErrors[key] = err.errors[key].message;
        });

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
        });
    }

    // Handle payment errors
    if (err.type === 'StripeCardError') {
        return res.status(400).json({
            success: false,
            message: 'Payment failed',
            error: err.message
        });
    }

    // Handle file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large',
            error: 'File size exceeds the maximum allowed limit'
        });
    }

    // Handle database connection errors
    if (err.name === 'MongoNetworkError') {
        return res.status(503).json({
            success: false,
            message: 'Database connection error',
            error: 'Unable to connect to database'
        });
    }

    // Handle rate limiting errors
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests',
            error: 'Rate limit exceeded. Please try again later.'
        });
    }

    // Default error response
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            error: err 
        })
    });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Handle unhandled promise rejections
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (err, promise) => {
        console.log('Unhandled Promise Rejection:', err.message);
        // Close server & exit process
        process.exit(1);
    });
};

// Handle uncaught exceptions
const handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        console.log('Uncaught Exception:', err.message);
        // Close server & exit process
        process.exit(1);
    });
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    AppError,
    handleUnhandledRejection,
    handleUncaughtException
}; 
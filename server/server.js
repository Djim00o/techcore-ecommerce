require('dotenv').config();
require('express-async-errors');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Import database connection
const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const reviewRoutes = require('./routes/reviews');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const paymentRoutes = require('./routes/payment');
const uploadRoutes = require('./routes/upload');
const searchRoutes = require('./routes/search');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler, notFound, handleUnhandledRejection, handleUncaughtException } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const { loggerMiddleware } = require('./middleware/logger');

// Initialize Express app
const app = express();

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Connect to database
database.connect();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TechCore E-commerce API',
            version: '1.0.0',
            description: 'Comprehensive API for TechCore e-commerce platform',
            contact: {
                name: 'TechCore API Support',
                email: 'api@techcore.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:5234',
                description: 'Development server'
            },
            {
                url: 'https://api.techcore.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./routes/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://js.stripe.com"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            frameSrc: ["'self'", "https://js.stripe.com"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for static files and health checks
        return req.url.startsWith('/static') || req.url === '/health';
    }
});

// API-specific rate limiter (more restrictive)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 50 : 500,
    message: {
        error: 'Too many API requests, please try again later.'
    }
});

// Auth-specific rate limiter (most restrictive)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 5 : 1000, // Much higher limit for development
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
    skipSuccessfulRequests: true
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5500', // For Live Server
            'http://127.0.0.1:5500',
            'http://localhost:8080', // For Python HTTP server
            'http://127.0.0.1:8080',
            'http://[::1]:8080' // IPv6 localhost
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Temporarily allow all origins for development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/techcore'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Custom middleware
app.use(loggerMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TechCore API Documentation'
}));

// Serve swagger spec as JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payment', apiLimiter, paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);

// Static file serving (for uploaded images, etc.)
app.use('/uploads', express.static('uploads'));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to TechCore API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            users: '/api/users',
            orders: '/api/orders',
            categories: '/api/categories',
            reviews: '/api/reviews',
            cart: '/api/cart',
            wishlist: '/api/wishlist',
            payment: '/api/payment',
            search: '/api/search',
            analytics: '/api/analytics'
        }
    });
});

// 404 handler for API routes
app.all('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.method} ${req.path} not found`,
        availableEndpoints: [
            'GET /api/products',
            'GET /api/categories',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api-docs'
        ]
    });
});

// Handle 404 for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 5234;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
    try {
        // Start HTTP server
        const server = app.listen(PORT, HOST, () => {
            console.log(`🚀 TechCore API Server running on http://${HOST}:${PORT}`);
            console.log(`📚 API Documentation: http://${HOST}:${PORT}/api-docs`);
            console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        
        // Handle server errors
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            
            const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
            
            switch (error.code) {
                case 'EACCES':
                    console.error(`❌ ${bind} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`❌ ${bind} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Initialize server
startServer();

module.exports = app; 
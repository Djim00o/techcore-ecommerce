const express = require('express');
const { query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 */
router.get('/dashboard', adminAuth, [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }

    // Get order statistics
    const orderStats = await Order.getOrderStats(startDate, now);

    // Get user statistics
    const userStats = await User.aggregate([
        {
            $facet: {
                totalUsers: [{ $count: 'count' }],
                newUsers: [
                    { $match: { createdAt: { $gte: startDate } } },
                    { $count: 'count' }
                ],
                activeUsers: [
                    { $match: { isActive: true } },
                    { $count: 'count' }
                ],
                verifiedUsers: [
                    { $match: { isVerified: true } },
                    { $count: 'count' }
                ]
            }
        }
    ]);

    // Get product statistics
    const productStats = await Product.aggregate([
        {
            $facet: {
                totalProducts: [{ $count: 'count' }],
                activeProducts: [
                    { $match: { status: 'active' } },
                    { $count: 'count' }
                ],
                outOfStock: [
                    { $match: { stock: 0 } },
                    { $count: 'count' }
                ],
                lowStock: [
                    { $match: { stock: { $gt: 0, $lte: 5 } } },
                    { $count: 'count' }
                ]
            }
        }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate } } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                totalSold: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                productName: { $first: '$items.name' }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
    ]);

    // Get sales by category
    const salesByCategory = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate } } },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $group: {
                _id: '$product.category',
                totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                totalItems: { $sum: '$items.quantity' }
            }
        },
        { $sort: { totalSales: -1 } }
    ]);

    // Get daily sales for the period
    const dailySales = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
                },
                sales: { $sum: '$total' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        data: {
            period,
            dateRange: { startDate, endDate: now },
            orders: orderStats,
            users: {
                total: userStats[0].totalUsers[0]?.count || 0,
                new: userStats[0].newUsers[0]?.count || 0,
                active: userStats[0].activeUsers[0]?.count || 0,
                verified: userStats[0].verifiedUsers[0]?.count || 0
            },
            products: {
                total: productStats[0].totalProducts[0]?.count || 0,
                active: productStats[0].activeProducts[0]?.count || 0,
                outOfStock: productStats[0].outOfStock[0]?.count || 0,
                lowStock: productStats[0].lowStock[0]?.count || 0
            },
            topProducts,
            salesByCategory,
            dailySales
        }
    });
}));

/**
 * @swagger
 * /api/analytics/sales:
 *   get:
 *     summary: Get detailed sales analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Sales analytics retrieved successfully
 */
router.get('/sales', adminAuth, [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy value')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        groupBy = 'day'
    } = req.query;

    // Build group stage based on groupBy parameter
    let groupStage;
    switch (groupBy) {
        case 'week':
            groupStage = {
                _id: {
                    year: { $year: '$orderDate' },
                    week: { $week: '$orderDate' }
                }
            };
            break;
        case 'month':
            groupStage = {
                _id: {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' }
                }
            };
            break;
        case 'day':
        default:
            groupStage = {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
                }
            };
            break;
    }

    const salesData = await Order.aggregate([
        {
            $match: {
                orderDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        {
            $group: {
                ...groupStage,
                totalSales: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: '$total' },
                totalItems: { $sum: { $sum: '$items.quantity' } }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        data: {
            period: { startDate, endDate },
            groupBy,
            salesData
        }
    });
}));

/**
 * @swagger
 * /api/analytics/products:
 *   get:
 *     summary: Get product performance analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [sales, views, rating, reviews]
 *           default: sales
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Product analytics retrieved successfully
 */
router.get('/products', adminAuth, [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
    query('metric').optional().isIn(['sales', 'views', 'rating', 'reviews']).withMessage('Invalid metric'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
    const {
        period = '30d',
        metric = 'sales',
        limit = 20
    } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }

    let productData;

    switch (metric) {
        case 'views':
            productData = await Product.find({ status: 'active' })
                .sort({ views: -1 })
                .limit(parseInt(limit))
                .select('name views category price images rating');
            break;

        case 'rating':
            productData = await Product.find({ 
                status: 'active',
                'rating.count': { $gt: 0 }
            })
                .sort({ 'rating.average': -1, 'rating.count': -1 })
                .limit(parseInt(limit))
                .select('name rating category price images');
            break;

        case 'reviews':
            productData = await Product.find({ status: 'active' })
                .sort({ 'rating.count': -1 })
                .limit(parseInt(limit))
                .select('name rating category price images');
            break;

        case 'sales':
        default:
            productData = await Order.aggregate([
                { $match: { orderDate: { $gte: startDate } } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product',
                        totalSold: { $sum: '$items.quantity' },
                        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                        productName: { $first: '$items.name' },
                        averagePrice: { $avg: '$items.price' }
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $project: {
                        name: '$productName',
                        totalSold: 1,
                        revenue: 1,
                        averagePrice: 1,
                        category: '$product.category',
                        currentPrice: '$product.price',
                        images: '$product.images',
                        rating: '$product.rating'
                    }
                },
                { $sort: { revenue: -1 } },
                { $limit: parseInt(limit) }
            ]);
            break;
    }

    res.json({
        success: true,
        data: {
            period,
            metric,
            products: productData
        }
    });
}));

/**
 * @swagger
 * /api/analytics/customers:
 *   get:
 *     summary: Get customer analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Customer analytics retrieved successfully
 */
router.get('/customers', adminAuth, [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }

    // Get customer segmentation
    const customerSegments = await User.aggregate([
        {
            $bucket: {
                groupBy: '$totalSpent',
                boundaries: [0, 100, 500, 1000, 5000, Infinity],
                default: 'high-value',
                output: {
                    count: { $sum: 1 },
                    averageSpent: { $avg: '$totalSpent' }
                }
            }
        }
    ]);

    // Get top customers
    const topCustomers = await User.find({ role: 'customer' })
        .sort({ totalSpent: -1 })
        .limit(10)
        .select('firstName lastName email totalSpent orderCount lastLogin');

    // Get new customer registrations
    const newCustomers = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                role: 'customer'
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Get customer lifetime value stats
    const clvStats = await User.aggregate([
        {
            $match: { role: 'customer' }
        },
        {
            $group: {
                _id: null,
                averageLifetimeValue: { $avg: '$totalSpent' },
                medianOrderCount: { $avg: '$orderCount' },
                totalCustomers: { $sum: 1 }
            }
        }
    ]);

    res.json({
        success: true,
        data: {
            period,
            segments: customerSegments,
            topCustomers,
            newCustomers,
            lifetimeValue: clvStats[0] || {
                averageLifetimeValue: 0,
                medianOrderCount: 0,
                totalCustomers: 0
            }
        }
    });
}));

module.exports = router; 
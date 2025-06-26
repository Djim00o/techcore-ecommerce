const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authMiddleware, adminAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews (Admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/', adminAuth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { page = 1, limit = 20, rating, productId } = req.query;

    // Build aggregation pipeline to get all reviews from all products
    const matchStage = {};
    if (rating) matchStage['reviews.rating'] = parseInt(rating);
    if (productId) matchStage._id = productId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
        { $match: matchStage },
        { $unwind: '$reviews' },
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.user',
                foreignField: '_id',
                as: 'reviews.userInfo'
            }
        },
        { $unwind: '$reviews.userInfo' },
        {
            $project: {
                'reviews._id': 1,
                'reviews.rating': 1,
                'reviews.title': 1,
                'reviews.comment': 1,
                'reviews.verified': 1,
                'reviews.createdAt': 1,
                'reviews.userInfo.firstName': 1,
                'reviews.userInfo.lastName': 1,
                productId: '$_id',
                productName: '$name'
            }
        },
        { $sort: { 'reviews.createdAt': -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ];

    const reviews = await Product.aggregate(pipeline);

    // Get total count
    const countPipeline = [
        { $match: matchStage },
        { $unwind: '$reviews' },
        { $count: 'total' }
    ];
    
    const countResult = await Product.aggregate(countPipeline);
    const totalReviews = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    res.json({
        success: true,
        data: reviews.map(item => ({
            ...item.reviews,
            product: {
                id: item.productId,
                name: item.productName
            }
        })),
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            limit: parseInt(limit)
        }
    });
}));

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/product/:productId', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = 'newest' } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Filter reviews by rating if specified
    let reviews = product.reviews;
    if (rating) {
        reviews = reviews.filter(review => review.rating === parseInt(rating));
    }

    // Sort reviews
    switch (sort) {
        case 'oldest':
            reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'rating_high':
            reviews.sort((a, b) => b.rating - a.rating);
            break;
        case 'rating_low':
            reviews.sort((a, b) => a.rating - b.rating);
            break;
        case 'newest':
        default:
            reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReviews = reviews.slice(skip, skip + parseInt(limit));

    // Populate user info for paginated reviews
    await Product.populate(product, {
        path: 'reviews.user',
        select: 'firstName lastName'
    });

    const totalReviews = reviews.length;
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    // Calculate rating breakdown
    const ratingBreakdown = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
        success: true,
        data: paginatedReviews,
        summary: {
            averageRating: product.rating.average,
            totalReviews: product.rating.count,
            ratingBreakdown
        },
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            limit: parseInt(limit)
        }
    });
}));

/**
 * @swagger
 * /api/reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark review as helpful
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review marked as helpful
 *       404:
 *         description: Review not found
 */
router.post('/:reviewId/helpful', authMiddleware, asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const product = await Product.findOne({ 'reviews._id': reviewId });
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    // Check if user already marked this review as helpful
    const alreadyHelpful = review.helpfulVotes.includes(req.user._id);
    
    if (alreadyHelpful) {
        // Remove helpful vote
        review.helpfulVotes.pull(req.user._id);
    } else {
        // Add helpful vote
        review.helpfulVotes.push(req.user._id);
    }

    await product.save();

    res.json({
        success: true,
        message: alreadyHelpful ? 'Helpful vote removed' : 'Review marked as helpful',
        helpfulCount: review.helpfulVotes.length
    });
}));

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete review (Admin only or review author)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 *       403:
 *         description: Access denied
 */
router.delete('/:reviewId', authMiddleware, asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const product = await Product.findOne({ 'reviews._id': reviewId });
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    // Only allow review author or admin to delete
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only delete your own reviews.'
        });
    }

    // Remove the review
    review.remove();
    
    // Recalculate product rating
    await product.calculateAverageRating();
    await product.save();

    res.json({
        success: true,
        message: 'Review deleted successfully'
    });
}));

module.exports = router; 
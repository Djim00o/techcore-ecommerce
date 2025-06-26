const express = require('express');
const { query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Advanced product search
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter for in-stock items only
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, price_asc, price_desc, rating_desc, newest]
 *         description: Sort order
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/', [
    query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
    query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    query('sort').optional().isIn(['relevance', 'price_asc', 'price_desc', 'rating_desc', 'newest']).withMessage('Invalid sort option')
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
        q,
        category,
        brand,
        minPrice,
        maxPrice,
        rating,
        inStock,
        sort = 'relevance',
        page = 1,
        limit = 20
    } = req.query;

    // Build search filter
    const filter = { status: 'active' };

    // Text search
    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } },
            { 'specifications.value': { $regex: q, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        filter.category = category;
    }

    // Brand filter
    if (brand) {
        filter.brand = new RegExp(brand, 'i');
    }

    // Price range filter
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (rating) {
        filter['rating.average'] = { $gte: parseFloat(rating) };
    }

    // Stock filter
    if (inStock === 'true') {
        filter.stock = { $gt: 0 };
    }

    // Build sort query
    let sortQuery = {};
    switch (sort) {
        case 'price_asc':
            sortQuery = { price: 1 };
            break;
        case 'price_desc':
            sortQuery = { price: -1 };
            break;
        case 'rating_desc':
            sortQuery = { 'rating.average': -1, 'rating.count': -1 };
            break;
        case 'newest':
            sortQuery = { createdAt: -1 };
            break;
        case 'relevance':
        default:
            // For relevance, we could implement a text score if using MongoDB text search
            sortQuery = { createdAt: -1 };
            break;
    }

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, totalProducts] = await Promise.all([
        Product.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(parseInt(limit))
            .select('name description price originalPrice images rating category brand stock availability'),
        Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Get faceted data for filters
    const facets = await Product.aggregate([
        { $match: { status: 'active', ...filter } },
        {
            $facet: {
                categories: [
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                brands: [
                    { $group: { _id: '$brand', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 20 }
                ],
                priceRanges: [
                    {
                        $bucket: {
                            groupBy: '$price',
                            boundaries: [0, 100, 300, 500, 1000, 2000, 5000],
                            default: '5000+',
                            output: { count: { $sum: 1 } }
                        }
                    }
                ],
                ratings: [
                    {
                        $bucket: {
                            groupBy: '$rating.average',
                            boundaries: [0, 1, 2, 3, 4, 5],
                            default: 'unrated',
                            output: { count: { $sum: 1 } }
                        }
                    }
                ]
            }
        }
    ]);

    res.json({
        success: true,
        data: products,
        searchQuery: q,
        filters: {
            category,
            brand,
            minPrice,
            maxPrice,
            rating,
            inStock,
            sort
        },
        facets: facets[0] || {},
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            limit: parseInt(limit)
        }
    });
}));

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions/autocomplete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 */
router.get('/suggestions', [
    query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { q, limit = 5 } = req.query;

    // Get product name suggestions
    const productSuggestions = await Product.find({
        status: 'active',
        name: { $regex: q, $options: 'i' }
    })
    .select('name category')
    .limit(parseInt(limit))
    .sort({ 'rating.average': -1, views: -1 });

    // Get brand suggestions
    const brandSuggestions = await Product.distinct('brand', {
        status: 'active',
        brand: { $regex: q, $options: 'i' }
    }).limit(parseInt(limit));

    // Get category suggestions
    const categories = [
        'graphics-cards', 'processors', 'motherboards', 'memory', 
        'storage', 'laptops', 'accessories'
    ];
    const categorySuggestions = categories.filter(cat => 
        cat.toLowerCase().includes(q.toLowerCase())
    ).slice(0, parseInt(limit));

    res.json({
        success: true,
        data: {
            products: productSuggestions.map(p => ({
                type: 'product',
                name: p.name,
                category: p.category
            })),
            brands: brandSuggestions.map(brand => ({
                type: 'brand',
                name: brand
            })),
            categories: categorySuggestions.map(cat => ({
                type: 'category',
                name: cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
            }))
        }
    });
}));

/**
 * @swagger
 * /api/search/popular:
 *   get:
 *     summary: Get popular search terms
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular search terms retrieved successfully
 */
router.get('/popular', [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    // Mock popular search terms - in a real app, this would come from search analytics
    const popularTerms = [
        'graphics card',
        'gaming laptop',
        'rtx 4090',
        'intel i7',
        'ddr5 ram',
        'nvme ssd',
        'mechanical keyboard',
        'gaming mouse',
        'amd ryzen',
        'ultrawide monitor'
    ].slice(0, parseInt(limit));

    res.json({
        success: true,
        data: popularTerms.map((term, index) => ({
            term,
            rank: index + 1,
            searches: Math.floor(Math.random() * 10000) + 1000 // Mock search count
        }))
    });
}));

module.exports = router; 
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authMiddleware, adminAuth, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAPIUsage } = require('../middleware/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category
 *         - brand
 *         - sku
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         slug:
 *           type: string
 *           description: URL-friendly product identifier
 *         description:
 *           type: string
 *           description: Product description
 *         shortDescription:
 *           type: string
 *           description: Brief product description
 *         category:
 *           type: string
 *           enum: [graphics-cards, processors, motherboards, memory, storage, laptops, accessories]
 *         brand:
 *           type: string
 *         sku:
 *           type: string
 *         price:
 *           type: number
 *           minimum: 0
 *         originalPrice:
 *           type: number
 *           minimum: 0
 *         stock:
 *           type: integer
 *           minimum: 0
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               alt:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *         specifications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: object
 *           properties:
 *             average:
 *               type: number
 *               minimum: 0
 *               maximum: 5
 *             count:
 *               type: integer
 *               minimum: 0
 *         status:
 *           type: string
 *           enum: [draft, active, inactive, discontinued]
 *         availability:
 *           type: string
 *           enum: [in-stock, out-of-stock, pre-order, discontinued]
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of products per page
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
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, name_asc, name_desc, rating_desc, newest, oldest]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured products
 *       - in: query
 *         name: onSale
 *         schema:
 *           type: boolean
 *         description: Filter products on sale
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalProducts:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
    query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'rating_desc', 'newest', 'oldest']).withMessage('Invalid sort option')
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
        page = 1,
        limit = 20,
        category,
        brand,
        minPrice,
        maxPrice,
        sort = 'newest',
        search,
        featured,
        onSale,
        inStock
    } = req.query;

    // Build filter query
    const filter = { status: 'active' };

    if (category) filter.category = category;
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (featured === 'true') filter.isFeatured = true;
    if (onSale === 'true') filter.isOnSale = true;
    if (inStock === 'true') filter.stock = { $gt: 0 };

    // Price range filter
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
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
        case 'name_asc':
            sortQuery = { name: 1 };
            break;
        case 'name_desc':
            sortQuery = { name: -1 };
            break;
        case 'rating_desc':
            sortQuery = { 'rating.average': -1, 'rating.count': -1 };
            break;
        case 'oldest':
            sortQuery = { createdAt: 1 };
            break;
        case 'newest':
        default:
            sortQuery = { createdAt: -1 };
            break;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, totalProducts] = await Promise.all([
        Product.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('relatedProducts', 'name price images rating'),
        Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    const currentPage = parseInt(page);

    logAPIUsage('GET /api/products', req.user, {
        filters: { category, brand, search, featured, onSale },
        pagination: { page: currentPage, limit: parseInt(limit) },
        resultsCount: products.length
    });

    res.json({
        success: true,
        data: products,
        pagination: {
            currentPage,
            totalPages,
            totalProducts,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
            limit: parseInt(limit)
        },
        filters: {
            category,
            brand,
            minPrice,
            maxPrice,
            search,
            featured,
            onSale
        }
    });
}));

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID or slug
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let product = await Product.findById(id)
        .populate('relatedProducts', 'name price images rating availability')
        .populate('reviews.user', 'firstName lastName');
    
    if (!product) {
        product = await Product.findOne({ slug: id })
            .populate('relatedProducts', 'name price images rating availability')
            .populate('reviews.user', 'firstName lastName');
    }

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Increment view count
    await product.incrementViews();

    // Add to user's recently viewed if authenticated
    if (req.user) {
        await req.user.addToRecentlyViewed(product._id);
    }

    logAPIUsage('GET /api/products/:id', req.user, {
        productId: product._id,
        productName: product.name,
        category: product.category
    });

    res.json({
        success: true,
        data: product
    });
}));

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', adminAuth, [
    body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Product name must be between 2 and 200 characters'),
    body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
    body('category').isIn(['graphics-cards', 'processors', 'motherboards', 'memory', 'storage', 'laptops', 'accessories']).withMessage('Invalid category'),
    body('brand').trim().isLength({ min: 1, max: 50 }).withMessage('Brand is required and must be less than 50 characters'),
    body('sku').trim().isLength({ min: 1, max: 50 }).withMessage('SKU is required and must be less than 50 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: req.body.sku.toUpperCase() });
    if (existingProduct) {
        return res.status(400).json({
            success: false,
            message: 'Product with this SKU already exists'
        });
    }

    const productData = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    logAPIUsage('POST /api/products', req.user, {
        productId: product._id,
        productName: product.name,
        sku: product.sku
    });

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
    });
}));

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product by ID (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/:id', adminAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Check if SKU is being changed and if it conflicts
    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
        const existingProduct = await Product.findOne({ 
            sku: req.body.sku.toUpperCase(),
            _id: { $ne: id }
        });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists'
            });
        }
    }

    // Update product
    Object.assign(product, req.body);
    product.updatedBy = req.user._id;
    await product.save();

    logAPIUsage('PUT /api/products/:id', req.user, {
        productId: product._id,
        productName: product.name,
        changes: Object.keys(req.body)
    });

    res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
    });
}));

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product by ID (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.delete('/:id', adminAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    await Product.findByIdAndDelete(id);

    logAPIUsage('DELETE /api/products/:id', req.user, {
        productId: id,
        productName: product.name,
        sku: product.sku
    });

    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
}));

/**
 * @swagger
 * /api/products/category/{category}:
 *   get:
 *     summary: Get products by category
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Product category
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/category/:category', asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    const products = await Product.findByCategory(category)
        .sort(sort === 'price_asc' ? { price: 1 } : sort === 'price_desc' ? { price: -1 } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments({ category, status: 'active' });

    res.json({
        success: true,
        data: products,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts,
            hasNextPage: page * limit < totalProducts,
            hasPrevPage: page > 1
        }
    });
}));

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 */
router.get('/featured', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const products = await Product.findFeatured()
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: products
    });
}));

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products
 *     tags: [Products]
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
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', [
    query('q').trim().isLength({ min: 1 }).withMessage('Search query is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { q, category, brand, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    const options = {};
    if (category) options.category = category;
    if (brand) options.brand = brand;
    if (minPrice) options.priceMin = parseFloat(minPrice);
    if (maxPrice) options.priceMax = parseFloat(maxPrice);

    const products = await Product.searchProducts(q, options)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const totalProducts = await Product.searchProducts(q, options).countDocuments();

    logAPIUsage('GET /api/products/search', req.user, {
        searchQuery: q,
        filters: options,
        resultsCount: products.length
    });

    res.json({
        success: true,
        data: products,
        searchQuery: q,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts,
            hasNextPage: page * limit < totalProducts,
            hasPrevPage: page > 1
        }
    });
}));

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Add product review
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - title
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 */
router.post('/:id/reviews', authMiddleware, [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
    body('comment').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
        review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
        return res.status(400).json({
            success: false,
            message: 'You have already reviewed this product'
        });
    }

    const reviewData = {
        user: req.user._id,
        rating,
        title,
        comment,
        verified: true // You might want to check if user actually purchased the product
    };

    await product.addReview(reviewData);

    logAPIUsage('POST /api/products/:id/reviews', req.user, {
        productId: product._id,
        productName: product.name,
        rating
    });

    res.status(201).json({
        success: true,
        message: 'Review added successfully'
    });
}));

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Update product stock (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - operation
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *               operation:
 *                 type: string
 *                 enum: [add, subtract, set]
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id/stock', adminAuth, [
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { quantity, operation } = req.body;

    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    const oldStock = product.stock;

    if (operation === 'set') {
        product.stock = quantity;
    } else if (operation === 'add') {
        product.stock += quantity;
    } else if (operation === 'subtract') {
        product.stock = Math.max(0, product.stock - quantity);
    }

    await product.save();

    logAPIUsage('PUT /api/products/:id/stock', req.user, {
        productId: product._id,
        productName: product.name,
        operation,
        quantity,
        oldStock,
        newStock: product.stock
    });

    res.json({
        success: true,
        message: 'Stock updated successfully',
        data: {
            productId: product._id,
            oldStock,
            newStock: product.stock
        }
    });
}));

module.exports = router; 
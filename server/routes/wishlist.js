const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('wishlist.product', 'name price originalPrice images rating availability stock');

    const wishlistItems = user.wishlist.map(item => ({
        id: item._id,
        product: item.product,
        addedAt: item.addedAt
    }));

    res.json({
        success: true,
        data: wishlistItems,
        count: wishlistItems.length
    });
}));

/**
 * @swagger
 * /api/wishlist/add:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to wishlist
 */
router.post('/add', authMiddleware, [
    body('productId').isMongoId().withMessage('Valid product ID is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    await req.user.addToWishlist(productId);

    res.json({
        success: true,
        message: 'Item added to wishlist successfully'
    });
}));

/**
 * @swagger
 * /api/wishlist/remove:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item removed from wishlist
 */
router.delete('/remove', authMiddleware, [
    body('productId').isMongoId().withMessage('Valid product ID is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { productId } = req.body;
    await req.user.removeFromWishlist(productId);

    res.json({
        success: true,
        message: 'Item removed from wishlist successfully'
    });
}));

/**
 * @swagger
 * /api/wishlist/move-to-cart:
 *   post:
 *     summary: Move item from wishlist to cart
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item moved to cart successfully
 */
router.post('/move-to-cart', authMiddleware, [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { productId, quantity = 1 } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    if (product.stock < quantity) {
        return res.status(400).json({
            success: false,
            message: `Only ${product.stock} items available in stock`
        });
    }

    // Add to cart and remove from wishlist
    await req.user.addToCart(productId, quantity);
    await req.user.removeFromWishlist(productId);

    res.json({
        success: true,
        message: 'Item moved to cart successfully'
    });
}));

module.exports = router; 
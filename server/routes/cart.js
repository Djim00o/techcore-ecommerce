const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('cart.product', 'name price originalPrice images stock availability');

    const cartItems = user.cart.map(item => ({
        id: item._id,
        product: item.product,
        quantity: item.quantity,
        addedAt: item.addedAt,
        subtotal: item.product.price * item.quantity
    }));

    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
        success: true,
        data: {
            items: cartItems,
            summary: {
                itemCount,
                subtotal: total,
                shipping: total > 50 ? 0 : 9.99,
                tax: total * 0.08,
                total: total + (total > 50 ? 0 : 9.99) + (total * 0.08)
            }
        }
    });
}));

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
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
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/add', authMiddleware, [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { productId, quantity } = req.body;

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

    await req.user.addToCart(productId, quantity);

    res.json({
        success: true,
        message: 'Item added to cart successfully'
    });
}));

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
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
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Cart updated successfully
 */
router.put('/update', authMiddleware, [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 0, max: 10 }).withMessage('Quantity must be between 0 and 10')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { productId, quantity } = req.body;

    if (quantity > 0) {
        // Check stock availability
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
    }

    await req.user.updateCartItem(productId, quantity);

    res.json({
        success: true,
        message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully'
    });
}));

/**
 * @swagger
 * /api/cart/remove:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
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
 *         description: Item removed from cart
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
    await req.user.updateCartItem(productId, 0);

    res.json({
        success: true,
        message: 'Item removed from cart successfully'
    });
}));

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/clear', authMiddleware, asyncHandler(async (req, res) => {
    await req.user.clearCart();

    res.json({
        success: true,
        message: 'Cart cleared successfully'
    });
}));

module.exports = router; 
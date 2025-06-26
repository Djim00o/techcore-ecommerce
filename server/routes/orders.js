const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authMiddleware, adminAuth, moderatorAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAPIUsage } = require('../middleware/logger');

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders or all orders (Admin)
 *     tags: [Orders]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, returned]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', authMiddleware, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status')
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
        limit = 10,
        status,
        startDate,
        endDate
    } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        startDate,
        endDate
    };

    let orders;
    let totalOrders;

    if (req.user.role === 'admin' || req.user.role === 'moderator') {
        // Admin/Moderator can see all orders
        const filter = {};
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.orderDate = {};
            if (startDate) filter.orderDate.$gte = new Date(startDate);
            if (endDate) filter.orderDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        [orders, totalOrders] = await Promise.all([
            Order.find(filter)
                .populate('user', 'firstName lastName email')
                .populate('items.product', 'name images')
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(filter)
        ]);
    } else {
        // Regular users can only see their own orders
        orders = await Order.findByUser(req.user._id, options);
        totalOrders = await Order.countDocuments({ user: req.user._id, ...(status && { status }) });
    }

    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    logAPIUsage('GET /api/orders', req.user, {
        isAdmin: req.user.role === 'admin',
        filters: { status, startDate, endDate },
        pagination: { page: parseInt(page), limit: parseInt(limit) },
        resultsCount: orders.length
    });

    res.json({
        success: true,
        data: orders,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalOrders,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            limit: parseInt(limit)
        }
    });
}));

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - billingAddress
 *               - shippingMethod
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               shippingMethod:
 *                 type: string
 *                 enum: [standard, express, overnight]
 *               couponCode:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', authMiddleware, [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
    body('shippingMethod').isIn(['standard', 'express', 'overnight']).withMessage('Invalid shipping method'),
    body('shippingAddress.firstName').trim().isLength({ min: 1 }).withMessage('Shipping first name is required'),
    body('shippingAddress.lastName').trim().isLength({ min: 1 }).withMessage('Shipping last name is required'),
    body('shippingAddress.address1').trim().isLength({ min: 1 }).withMessage('Shipping address is required'),
    body('shippingAddress.city').trim().isLength({ min: 1 }).withMessage('Shipping city is required'),
    body('shippingAddress.state').trim().isLength({ min: 1 }).withMessage('Shipping state is required'),
    body('shippingAddress.postalCode').trim().isLength({ min: 1 }).withMessage('Shipping postal code is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { items, shippingAddress, billingAddress, shippingMethod, couponCode, notes } = req.body;

    // Validate products and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product ${item.productId} not found`
            });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock for product ${product.name}`
            });
        }

        const orderItem = {
            product: product._id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            quantity: item.quantity,
            image: product.images?.[0]?.url
        };

        orderItems.push(orderItem);
        subtotal += product.price * item.quantity;
    }

    // Calculate shipping cost
    let shippingCost = 0;
    if (subtotal < 50) {
        switch (shippingMethod) {
            case 'standard':
                shippingCost = 9.99;
                break;
            case 'express':
                shippingCost = 19.99;
                break;
            case 'overnight':
                shippingCost = 29.99;
                break;
        }
    } else {
        // Free shipping on orders over $50, but express/overnight still cost extra
        switch (shippingMethod) {
            case 'express':
                shippingCost = 10.00;
                break;
            case 'overnight':
                shippingCost = 20.00;
                break;
        }
    }

    // Calculate tax (8%)
    const tax = subtotal * 0.08;

    // Apply coupon discount if provided
    let discount = 0;
    if (couponCode) {
        // This would integrate with a coupon system
        // For now, just apply a simple discount
        if (couponCode === 'SAVE10') {
            discount = subtotal * 0.10;
        }
    }

    const total = subtotal + shippingCost + tax - discount;

    // Create order
    const orderData = {
        user: req.user._id,
        items: orderItems,
        subtotal,
        shipping: shippingCost,
        tax,
        discount,
        total,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        shippingMethod,
        couponCode,
        notes
    };

    const order = new Order(orderData);
    
    // Calculate estimated delivery
    order.calculateEstimatedDelivery();
    
    await order.save();

    // Update product stock
    for (const item of items) {
        await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } }
        );
    }

    // Update user order stats
    await req.user.updateOrderStats(total);

    // Clear user's cart
    await req.user.clearCart();

    logAPIUsage('POST /api/orders', req.user, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total,
        itemCount: orderItems.length
    });

    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
    });
}));

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id)
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name images slug');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    // Users can only view their own orders, admins can view any
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only view your own orders.'
        });
    }

    logAPIUsage('GET /api/orders/:id', req.user, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        isOwnOrder: order.user._id.toString() === req.user._id.toString()
    });

    res.json({
        success: true,
        data: order
    });
}));

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order
 */
router.put('/:id/cancel', authMiddleware, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id).populate('items.product');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    // Users can only cancel their own orders
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }

    if (!order.canCancel) {
        return res.status(400).json({
            success: false,
            message: 'Order cannot be cancelled'
        });
    }

    // Restore product stock
    for (const item of order.items) {
        await Product.findByIdAndUpdate(
            item.product._id,
            { $inc: { stock: item.quantity } }
        );
    }

    await order.addTrackingUpdate('cancelled', `Order cancelled. Reason: ${reason || 'No reason provided'}`);

    logAPIUsage('PUT /api/orders/:id/cancel', req.user, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason
    });

    res.json({
        success: true,
        message: 'Order cancelled successfully'
    });
}));

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin/Moderator only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - message
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled, returned]
 *               message:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.put('/:id/status', moderatorAuth, [
    body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
    body('message').trim().isLength({ min: 1 }).withMessage('Status message is required')
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
    const { status, message, trackingNumber, carrier } = req.body;

    const order = await Order.findById(id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    // Update tracking number and carrier if provided
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;

    await order.addTrackingUpdate(status, message);

    logAPIUsage('PUT /api/orders/:id/status', req.user, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: status,
        trackingNumber,
        carrier
    });

    res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
    });
}));

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     summary: Get order statistics (Admin only)
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 */
router.get('/stats', adminAuth, asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const stats = await Order.getOrderStats(startDate, endDate);

    res.json({
        success: true,
        data: stats
    });
}));

module.exports = router; 
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware, adminAuth, verifyOwnership } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAPIUsage } = require('../middleware/logger');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, admin, moderator]
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/', adminAuth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['customer', 'admin', 'moderator']).withMessage('Invalid role')
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
        role,
        search,
        isActive
    } = req.query;

    // Build filter query
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
        filter.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, totalUsers] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password -refreshTokens'),
        User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    logAPIUsage('GET /api/users', req.user, {
        filters: { role, search, isActive },
        pagination: { page: parseInt(page), limit: parseInt(limit) },
        resultsCount: users.length
    });

    res.json({
        success: true,
        data: users,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            limit: parseInt(limit)
        }
    });
}));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Only allow users to view their own profile or admin to view any
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only view your own profile.'
        });
    }

    const user = await User.findById(id)
        .populate('cart.product', 'name price images')
        .populate('wishlist.product', 'name price images')
        .populate('recentlyViewed.product', 'name price images');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    logAPIUsage('GET /api/users/:id', req.user, {
        targetUserId: id,
        viewingOwnProfile: req.user._id.toString() === id
    });

    res.json({
        success: true,
        data: user
    });
}));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer-not-to-say]
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', authMiddleware, [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('dateOfBirth').optional().isISO8601().withMessage('Please provide a valid date'),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']).withMessage('Invalid gender')
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
    
    // Only allow users to update their own profile or admin to update any
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only update your own profile.'
        });
    }

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Update allowed fields
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'preferences'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    Object.assign(user, updates);
    await user.save();

    logAPIUsage('PUT /api/users/:id', req.user, {
        targetUserId: id,
        updatedFields: Object.keys(updates)
    });

    res.json({
        success: true,
        message: 'User updated successfully',
        data: user
    });
}));

/**
 * @swagger
 * /api/users/{id}/addresses:
 *   post:
 *     summary: Add new address to user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - address1
 *               - city
 *               - state
 *               - zipCode
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [billing, shipping, both]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               address1:
 *                 type: string
 *               address2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address added successfully
 */
router.post('/:id/addresses', authMiddleware, [
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
    body('address1').trim().isLength({ min: 1, max: 100 }).withMessage('Address line 1 is required'),
    body('city').trim().isLength({ min: 1, max: 50 }).withMessage('City is required'),
    body('state').trim().isLength({ min: 1, max: 50 }).withMessage('State is required'),
    body('zipCode').trim().isLength({ min: 1, max: 20 }).withMessage('ZIP code is required'),
    body('type').optional().isIn(['billing', 'shipping', 'both']).withMessage('Invalid address type')
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
    
    // Only allow users to add addresses to their own profile
    if (req.user._id.toString() !== id) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only add addresses to your own profile.'
        });
    }

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const addressData = {
        type: req.body.type || 'both',
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        company: req.body.company,
        address1: req.body.address1,
        address2: req.body.address2,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        country: req.body.country || 'United States',
        phone: req.body.phone,
        isDefault: req.body.isDefault || false
    };

    user.addresses.push(addressData);
    await user.save();

    res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: user.addresses[user.addresses.length - 1]
    });
}));

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   put:
 *     summary: Deactivate user account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id/deactivate', adminAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    user.isActive = false;
    await user.save();

    logAPIUsage('PUT /api/users/:id/deactivate', req.user, {
        targetUserId: id,
        targetUserEmail: user.email
    });

    res.json({
        success: true,
        message: 'User deactivated successfully'
    });
}));

/**
 * @swagger
 * /api/users/{id}/activate:
 *   put:
 *     summary: Activate user account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id/activate', adminAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    user.isActive = true;
    await user.save();

    logAPIUsage('PUT /api/users/:id/activate', req.user, {
        targetUserId: id,
        targetUserEmail: user.email
    });

    res.json({
        success: true,
        message: 'User activated successfully'
    });
}));

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get('/stats', adminAuth, asyncHandler(async (req, res) => {
    const stats = await User.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
                totalSpent: { $sum: '$totalSpent' },
                averageSpent: { $avg: '$totalSpent' }
            }
        }
    ]);

    const roleStats = await User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ]);

    const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email createdAt');

    res.json({
        success: true,
        data: {
            overview: stats[0] || {
                totalUsers: 0,
                activeUsers: 0,
                verifiedUsers: 0,
                totalSpent: 0,
                averageSpent: 0
            },
            byRole: roleStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            recentUsers
        }
    });
}));

module.exports = router; 
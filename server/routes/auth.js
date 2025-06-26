const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logSecurityEvent } = require('../middleware/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 8
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', [
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        logSecurityEvent('Registration attempt with existing email', { email, ip: req.ip });
        return res.status(400).json({
            success: false,
            message: 'User with this email already exists'
        });
    }

    // Create new user
    const user = new User({
        firstName,
        lastName,
        email,
        password,
        phone,
        isVerified: process.env.NODE_ENV === 'development' // Auto-verify in development
    });

    await user.save();

    // Generate verification token if email verification is enabled
    if (process.env.NODE_ENV !== 'development') {
        const verificationToken = user.generateVerificationToken();
        await user.save();
        
        // In a real app, send verification email here
        console.log(`Verification token for ${email}: ${verificationToken}`);
    }

    // Generate JWT token
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    logSecurityEvent('User registered', { 
        userId: user._id, 
        email: user.email, 
        ip: req.ip 
    });

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        refreshToken,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        }
    });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { email, password, rememberMe } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        logSecurityEvent('Login attempt with non-existent email', { email, ip: req.ip });
        return res.status(400).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Check if account is locked
    if (user.isLocked) {
        logSecurityEvent('Login attempt on locked account', { 
            userId: user._id, 
            email, 
            ip: req.ip 
        });
        return res.status(423).json({
            success: false,
            message: 'Account is temporarily locked due to too many failed login attempts'
        });
    }

    // Check if account is active
    if (!user.isActive) {
        logSecurityEvent('Login attempt on inactive account', { 
            userId: user._id, 
            email, 
            ip: req.ip 
        });
        return res.status(400).json({
            success: false,
            message: 'Account has been deactivated'
        });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
        await user.incrementLoginAttempts();
        logSecurityEvent('Failed login attempt', { 
            userId: user._id, 
            email, 
            ip: req.ip,
            loginAttempts: user.loginAttempts + 1
        });
        return res.status(400).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    // Set cookie for remember me
    if (rememberMe) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
    }

    logSecurityEvent('User logged in', { 
        userId: user._id, 
        email: user.email, 
        ip: req.ip 
    });

    res.json({
        success: true,
        message: 'Login successful',
        token,
        refreshToken,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin
        }
    });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const user = req.user;

    // Remove refresh token
    if (refreshToken) {
        user.removeRefreshToken(refreshToken);
        await user.save();
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    logSecurityEvent('User logged out', { 
        userId: user._id, 
        email: user.email, 
        ip: req.ip 
    });

    res.json({
        success: true,
        message: 'Logout successful'
    });
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {};
    const cookieRefreshToken = req.cookies?.refreshToken;
    
    const token = refreshToken || cookieRefreshToken;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token is required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Check if refresh token exists in user's tokens
        const tokenExists = user.refreshTokens.some(
            rt => rt.token === token && rt.isActive && rt.expiresAt > new Date()
        );

        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Generate new access token
        const newAccessToken = user.generateAuthToken();

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: newAccessToken
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
}));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal that user doesn't exist
        return res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // In a real app, send email with reset link here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    logSecurityEvent('Password reset requested', { 
        userId: user._id, 
        email, 
        ip: req.ip 
    });

    res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Only include token in development
        ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
}));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { token, password } = req.body;

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Reset login attempts if account was locked
    if (user.isLocked) {
        await user.resetLoginAttempts();
    }

    await user.save();

    logSecurityEvent('Password reset completed', { 
        userId: user._id, 
        email: user.email, 
        ip: req.ip 
    });

    res.json({
        success: true,
        message: 'Password has been reset successfully'
    });
}));

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-email', [
    body('token').notEmpty().withMessage('Verification token is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { token } = req.body;

    const user = await User.findOne({
        verificationToken: token,
        verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification token'
        });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    logSecurityEvent('Email verified', { 
        userId: user._id, 
        email: user.email, 
        ip: req.ip 
    });

    res.json({
        success: true,
        message: 'Email verified successfully'
    });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('cart.product', 'name price images')
        .populate('wishlist.product', 'name price images')
        .populate('recentlyViewed.product', 'name price images');

    res.json({
        success: true,
        user
    });
}));

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 */
router.put('/change-password', authMiddleware, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logSecurityEvent('Password changed', { 
        userId: user._id, 
        email: user.email, 
        ip: req.ip 
    });

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
}));

module.exports = router; 
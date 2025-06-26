const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/payment/process:
 *   post:
 *     summary: Process payment for order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentMethod
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal]
 *               amount:
 *                 type: number
 *               cardDetails:
 *                 type: object
 *                 properties:
 *                   number:
 *                     type: string
 *                   expiryMonth:
 *                     type: string
 *                   expiryYear:
 *                     type: string
 *                   cvv:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Payment failed
 */
router.post('/process', authMiddleware, [
    body('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'stripe']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { orderId, paymentMethod, amount, cardDetails } = req.body;

    // In a real implementation, this would integrate with payment providers like Stripe, PayPal, etc.
    // For demo purposes, we'll simulate payment processing

    try {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate mock transaction ID
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Simulate payment success/failure (90% success rate for demo)
        const paymentSuccess = Math.random() > 0.1;

        if (!paymentSuccess) {
            return res.status(400).json({
                success: false,
                message: 'Payment processing failed. Please try again.',
                error: {
                    code: 'PAYMENT_DECLINED',
                    details: 'Insufficient funds or card declined'
                }
            });
        }

        // Mock successful payment response
        const paymentResult = {
            transactionId,
            status: 'completed',
            amount,
            currency: 'USD',
            paymentMethod,
            processedAt: new Date(),
            fees: amount * 0.029 + 0.30 // Typical payment processing fees
        };

        res.json({
            success: true,
            message: 'Payment processed successfully',
            data: paymentResult
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed due to server error'
        });
    }
}));

/**
 * @swagger
 * /api/payment/methods:
 *   get:
 *     summary: Get available payment methods
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 */
router.get('/methods', asyncHandler(async (req, res) => {
    const paymentMethods = [
        {
            id: 'credit_card',
            name: 'Credit Card',
            description: 'Visa, MasterCard, American Express',
            fees: '2.9% + $0.30',
            processingTime: 'Instant',
            enabled: true
        },
        {
            id: 'debit_card',
            name: 'Debit Card',
            description: 'Bank debit cards',
            fees: '2.9% + $0.30',
            processingTime: 'Instant',
            enabled: true
        },
        {
            id: 'paypal',
            name: 'PayPal',
            description: 'Pay with your PayPal account',
            fees: '3.49% + $0.49',
            processingTime: 'Instant',
            enabled: true
        },
        {
            id: 'stripe',
            name: 'Stripe',
            description: 'Secure payment processing',
            fees: '2.9% + $0.30',
            processingTime: 'Instant',
            enabled: true
        }
    ];

    res.json({
        success: true,
        data: paymentMethods.filter(method => method.enabled)
    });
}));

/**
 * @swagger
 * /api/payment/refund:
 *   post:
 *     summary: Process refund (Admin only)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - amount
 *               - reason
 *             properties:
 *               transactionId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Refund failed
 */
router.post('/refund', authMiddleware, [
    body('transactionId').notEmpty().withMessage('Transaction ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('reason').trim().isLength({ min: 1 }).withMessage('Refund reason is required')
], asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { transactionId, amount, reason } = req.body;

    try {
        // Simulate refund processing
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate mock refund ID
        const refundId = `rf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const refundResult = {
            refundId,
            originalTransactionId: transactionId,
            amount,
            currency: 'USD',
            reason,
            status: 'completed',
            processedAt: new Date(),
            expectedInAccount: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 business days
        };

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: refundResult
        });

    } catch (error) {
        console.error('Refund processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Refund processing failed due to server error'
        });
    }
}));

/**
 * @swagger
 * /api/payment/validate-card:
 *   post:
 *     summary: Validate credit card details
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardNumber
 *               - expiryMonth
 *               - expiryYear
 *               - cvv
 *             properties:
 *               cardNumber:
 *                 type: string
 *               expiryMonth:
 *                 type: string
 *               expiryYear:
 *                 type: string
 *               cvv:
 *                 type: string
 *     responses:
 *       200:
 *         description: Card validation result
 */
router.post('/validate-card', [
    body('cardNumber').matches(/^\d{13,19}$/).withMessage('Invalid card number'),
    body('expiryMonth').matches(/^(0[1-9]|1[0-2])$/).withMessage('Invalid expiry month'),
    body('expiryYear').matches(/^\d{4}$/).withMessage('Invalid expiry year'),
    body('cvv').matches(/^\d{3,4}$/).withMessage('Invalid CVV')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { cardNumber, expiryMonth, expiryYear, cvv } = req.body;

    // Simple card type detection based on first digits
    let cardType = 'unknown';
    const firstDigit = cardNumber.charAt(0);
    const firstTwoDigits = cardNumber.substring(0, 2);
    const firstFourDigits = cardNumber.substring(0, 4);

    if (firstDigit === '4') {
        cardType = 'visa';
    } else if (['51', '52', '53', '54', '55'].includes(firstTwoDigits)) {
        cardType = 'mastercard';
    } else if (['34', '37'].includes(firstTwoDigits)) {
        cardType = 'amex';
    } else if (firstFourDigits === '6011') {
        cardType = 'discover';
    }

    // Check if card is expired
    const now = new Date();
    const expiry = new Date(parseInt(expiryYear), parseInt(expiryMonth) - 1);
    const isExpired = expiry < now;

    // Luhn algorithm for card number validation
    const luhnCheck = (num) => {
        let sum = 0;
        let isEven = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let digit = parseInt(num[i]);
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    };

    const isValidLuhn = luhnCheck(cardNumber);

    res.json({
        success: true,
        data: {
            cardType,
            isValid: isValidLuhn && !isExpired,
            isExpired,
            validLuhn: isValidLuhn,
            maskedNumber: `****-****-****-${cardNumber.slice(-4)}`
        }
    });
}));

module.exports = router; 
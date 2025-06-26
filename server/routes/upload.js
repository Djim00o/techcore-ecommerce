const express = require('express');
const { authMiddleware, adminAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload image file (Admin only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 description: Upload folder (e.g., products, categories, users)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file or upload failed
 */
router.post('/image', adminAuth, asyncHandler(async (req, res) => {
    // For now, return a mock response since file upload requires additional setup
    // In a real implementation, this would use multer or similar for file handling
    
    const mockImageUrl = `https://images.techcore.com/uploads/${Date.now()}_sample.jpg`;
    
    res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
            url: mockImageUrl,
            filename: `${Date.now()}_sample.jpg`,
            size: 1024000, // 1MB mock size
            type: 'image/jpeg',
            uploadedAt: new Date()
        }
    });
}));

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', authMiddleware, asyncHandler(async (req, res) => {
    // Mock avatar upload response
    const mockAvatarUrl = `https://images.techcore.com/avatars/${req.user._id}_${Date.now()}.jpg`;
    
    res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
            url: mockAvatarUrl,
            filename: `${req.user._id}_${Date.now()}.jpg`,
            size: 512000, // 512KB mock size
            type: 'image/jpeg',
            uploadedAt: new Date()
        }
    });
}));

/**
 * @swagger
 * /api/upload/document:
 *   post:
 *     summary: Upload document file (Admin only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [manual, specification, warranty]
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post('/document', adminAuth, asyncHandler(async (req, res) => {
    // Mock document upload response
    const mockDocumentUrl = `https://docs.techcore.com/uploads/${Date.now()}_document.pdf`;
    
    res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
            url: mockDocumentUrl,
            filename: `${Date.now()}_document.pdf`,
            size: 2048000, // 2MB mock size
            type: 'application/pdf',
            uploadedAt: new Date()
        }
    });
}));

module.exports = router; 
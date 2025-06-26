const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authMiddleware, adminAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all product categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
    const { featured } = req.query;
    
    let filter = {};
    if (featured === 'true') {
        filter.featured = true;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    res.json({
        success: true,
        data: {
            categories,
            count: categories.length
        }
    });
}));

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }

    res.json({
        success: true,
        data: category
    });
}));

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               featured:
 *                 type: boolean
 *               metaDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin access required
 */
router.post('/', adminAuth, [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('slug').trim().notEmpty().withMessage('Category slug is required'),
    body('description').trim().notEmpty().withMessage('Category description is required'),
    body('icon').optional().trim(),
    body('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
    body('metaDescription').optional().trim()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { name, slug, description, icon, featured, metaDescription } = req.body;

    // Check if category with same slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
        return res.status(400).json({
            success: false,
            message: 'Category with this slug already exists'
        });
    }

    const category = new Category({
        name,
        slug,
        description,
        icon: icon || 'fas fa-tag',
        featured: featured || false,
        metaDescription: metaDescription || description
    });

    await category.save();

    res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
    });
}));

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               featured:
 *                 type: boolean
 *               metaDescription:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       403:
 *         description: Admin access required
 */
router.put('/:id', adminAuth, [
    body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
    body('slug').optional().trim().notEmpty().withMessage('Category slug cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Category description cannot be empty'),
    body('icon').optional().trim(),
    body('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
    body('metaDescription').optional().trim()
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
    const updateData = req.body;

    // If slug is being updated, check for conflicts
    if (updateData.slug) {
        const existingCategory = await Category.findOne({ 
            slug: updateData.slug, 
            _id: { $ne: id } 
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this slug already exists'
            });
        }
    }

    const category = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }

    res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
    });
}));

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       403:
 *         description: Admin access required
 */
router.delete('/:id', adminAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }

    res.json({
        success: true,
        message: 'Category deleted successfully'
    });
}));

module.exports = router; 
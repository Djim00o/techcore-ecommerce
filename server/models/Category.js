const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - description
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: The category name
 *         slug:
 *           type: string
 *           description: URL-friendly version of the name
 *         description:
 *           type: string
 *           description: Category description
 *         icon:
 *           type: string
 *           description: Font Awesome icon class
 *         featured:
 *           type: boolean
 *           description: Whether the category is featured
 *         metaDescription:
 *           type: string
 *           description: SEO meta description
 *         productCount:
 *           type: number
 *           description: Number of products in this category
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *         sortOrder:
 *           type: number
 *           description: Display order
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        required: [true, 'Category slug is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    description: {
        type: String,
        required: [true, 'Category description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    icon: {
        type: String,
        default: 'fas fa-tag',
        trim: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    metaDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    productCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ featured: 1, isActive: 1 });
categorySchema.index({ sortOrder: 1, name: 1 });

// Virtual for products
categorySchema.virtual('products', {
    ref: 'Product',
    localField: 'slug',
    foreignField: 'category',
    justOne: false
});

// Pre-save middleware to generate slug if not provided
categorySchema.pre('save', function(next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    next();
});

// Static method to get categories with product counts
categorySchema.statics.getWithProductCounts = async function() {
    return this.aggregate([
        {
            $lookup: {
                from: 'products',
                localField: 'slug',
                foreignField: 'category',
                as: 'products'
            }
        },
        {
            $addFields: {
                productCount: { $size: '$products' }
            }
        },
        {
            $project: {
                products: 0
            }
        },
        {
            $sort: { sortOrder: 1, name: 1 }
        }
    ]);
};

// Static method to get featured categories
categorySchema.statics.getFeatured = async function() {
    return this.find({ featured: true, isActive: true })
        .sort({ sortOrder: 1, name: 1 });
};

// Instance method to update product count
categorySchema.methods.updateProductCount = async function() {
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({ category: this.slug });
    this.productCount = count;
    return this.save();
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 
const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    helpful: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const variantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false }
    }],
    specifications: [specificationSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: {
            values: ['graphics-cards', 'processors', 'motherboards', 'memory', 'storage', 'cooling', 'laptops', 'accessories'],
            message: 'Invalid category'
        }
    },
    subcategory: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        required: [true, 'Product brand is required'],
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    cost: {
        type: Number,
        min: [0, 'Cost cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD']
    },
    stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 10,
        min: 0
    },
    weight: {
        value: { type: Number, min: 0 },
        unit: { type: String, enum: ['g', 'kg', 'lb', 'oz'], default: 'kg' }
    },
    dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: { type: String, enum: ['mm', 'cm', 'in'], default: 'cm' }
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            default: function() { return this.name; }
        },
        isPrimary: {
            type: Boolean,
            default: false
        },
        cloudinaryId: String
    }],
    variants: [variantSchema],
    specifications: [specificationSchema],
    features: [{
        type: String,
        trim: true
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0,
            min: 0
        },
        distribution: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 }
        }
    },
    reviews: [reviewSchema],
    relatedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    seo: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String]
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'discontinued'],
        default: 'active'
    },
    availability: {
        type: String,
        enum: ['in-stock', 'out-of-stock', 'pre-order', 'discontinued'],
        default: 'in-stock'
    },
    isNewProduct: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isBestseller: {
        type: Boolean,
        default: false
    },
    isOnSale: {
        type: Boolean,
        default: false
    },
    saleEndDate: {
        type: Date
    },
    warranty: {
        period: Number,
        unit: { type: String, enum: ['days', 'months', 'years'], default: 'months' },
        description: String
    },
    shipping: {
        isFreeShipping: { type: Boolean, default: false },
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        }
    },
    views: {
        type: Number,
        default: 0
    },
    purchases: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ status: 1, availability: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.stock === 0) return 'out-of-stock';
    if (this.stock <= this.lowStockThreshold) return 'low-stock';
    return 'in-stock';
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency
    }).format(this.price);
});

// Pre-save middleware
productSchema.pre('save', function(next) {
    // Generate slug if not provided
    if (!this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }
    
    // Update sale status based on price comparison
    if (this.originalPrice && this.originalPrice > this.price) {
        this.isOnSale = true;
    } else {
        this.isOnSale = false;
    }
    
    // Update availability based on stock
    if (this.stock === 0) {
        this.availability = 'out-of-stock';
    } else if (this.availability === 'out-of-stock' && this.stock > 0) {
        this.availability = 'in-stock';
    }
    
    next();
});

// Instance methods
productSchema.methods.updateRating = function() {
    const reviews = this.reviews;
    if (reviews.length === 0) {
        this.rating.average = 0;
        this.rating.count = 0;
        this.rating.distribution = { five: 0, four: 0, three: 0, two: 0, one: 0 };
        return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = Math.round((totalRating / reviews.length) * 10) / 10;
    this.rating.count = reviews.length;
    
    // Update distribution
    this.rating.distribution = {
        five: reviews.filter(r => r.rating === 5).length,
        four: reviews.filter(r => r.rating === 4).length,
        three: reviews.filter(r => r.rating === 3).length,
        two: reviews.filter(r => r.rating === 2).length,
        one: reviews.filter(r => r.rating === 1).length
    };
};

productSchema.methods.addReview = function(reviewData) {
    this.reviews.push(reviewData);
    this.updateRating();
    return this.save();
};

productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
    if (operation === 'subtract') {
        this.stock = Math.max(0, this.stock - quantity);
    } else if (operation === 'add') {
        this.stock += quantity;
    }
    
    return this.save();
};

productSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Static methods
productSchema.statics.findByCategory = function(category) {
    return this.find({ category, status: 'active' });
};

productSchema.statics.findFeatured = function() {
    return this.find({ isFeatured: true, status: 'active' });
};

productSchema.statics.findOnSale = function() {
    return this.find({ isOnSale: true, status: 'active' });
};

productSchema.statics.searchProducts = function(query, options = {}) {
    const searchQuery = {
        $and: [
            { status: 'active' },
            {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { brand: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ]
            }
        ]
    };
    
    if (options.category) {
        searchQuery.$and.push({ category: options.category });
    }
    
    if (options.brand) {
        searchQuery.$and.push({ brand: options.brand });
    }
    
    if (options.priceMin || options.priceMax) {
        const priceFilter = {};
        if (options.priceMin) priceFilter.$gte = options.priceMin;
        if (options.priceMax) priceFilter.$lte = options.priceMax;
        searchQuery.$and.push({ price: priceFilter });
    }
    
    return this.find(searchQuery);
};

module.exports = mongoose.model('Product', productSchema); 
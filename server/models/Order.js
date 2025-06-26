const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: {
        type: String
    }
});

const shippingAddressSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    address1: {
        type: String,
        required: true,
        trim: true
    },
    address2: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    postalCode: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true,
        default: 'United States'
    },
    phone: {
        type: String,
        trim: true
    }
});

const paymentInfoSchema = new mongoose.Schema({
    method: {
        type: String,
        required: true,
        enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer']
    },
    transactionId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    refundDate: {
        type: Date
    }
});

const orderTrackingSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    
    // Pricing
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shipping: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    tax: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    discount: {
        type: Number,
        min: 0,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Addresses
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    billingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    
    // Payment
    paymentInfo: paymentInfoSchema,
    
    // Order Status
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    
    // Shipping
    shippingMethod: {
        type: String,
        required: true,
        enum: ['standard', 'express', 'overnight'],
        default: 'standard'
    },
    trackingNumber: {
        type: String
    },
    carrier: {
        type: String
    },
    estimatedDelivery: {
        type: Date
    },
    actualDelivery: {
        type: Date
    },
    
    // Tracking History
    tracking: [orderTrackingSchema],
    
    // Coupon/Promo Code
    couponCode: {
        type: String,
        trim: true
    },
    couponDiscount: {
        type: Number,
        min: 0,
        default: 0
    },
    
    // Notes
    notes: {
        type: String,
        maxlength: 1000
    },
    
    // Flags
    isGift: {
        type: Boolean,
        default: false
    },
    giftMessage: {
        type: String,
        maxlength: 500
    },
    
    // Dates
    orderDate: {
        type: Date,
        default: Date.now
    },
    shippedDate: {
        type: Date
    },
    deliveredDate: {
        type: Date
    },
    cancelledDate: {
        type: Date
    },
    
    // Return/Refund
    returnRequested: {
        type: Boolean,
        default: false
    },
    returnReason: {
        type: String
    },
    returnDate: {
        type: Date
    },
    refundAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    refundDate: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ user: 1, orderDate: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'paymentInfo.transactionId': 1 });
orderSchema.index({ trackingNumber: 1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
    return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for can cancel
orderSchema.virtual('canCancel').get(function() {
    return ['pending', 'confirmed'].includes(this.status);
});

// Virtual for can return
orderSchema.virtual('canReturn').get(function() {
    const deliveredDate = this.deliveredDate;
    if (!deliveredDate || this.status !== 'delivered') return false;
    
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 30; // 30-day return policy
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew) {
        // Generate unique order number
        const prefix = 'TC';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `${prefix}${timestamp}${random}`;
        
        // Ensure uniqueness
        let isUnique = false;
        while (!isUnique) {
            const existing = await this.constructor.findOne({ orderNumber: this.orderNumber });
            if (!existing) {
                isUnique = true;
            } else {
                const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                this.orderNumber = `${prefix}${timestamp}${newRandom}`;
            }
        }
        
        // Add initial tracking entry
        this.tracking.push({
            status: this.status,
            message: 'Order placed successfully',
            timestamp: new Date()
        });
    }
    
    next();
});

// Instance method to add tracking update
orderSchema.methods.addTrackingUpdate = function(status, message, location = null) {
    this.tracking.push({
        status,
        message,
        timestamp: new Date(),
        location
    });
    
    this.status = status;
    
    // Update relevant dates
    if (status === 'shipped' && !this.shippedDate) {
        this.shippedDate = new Date();
    } else if (status === 'delivered' && !this.deliveredDate) {
        this.deliveredDate = new Date();
    } else if (status === 'cancelled' && !this.cancelledDate) {
        this.cancelledDate = new Date();
    }
    
    return this.save();
};

// Instance method to calculate estimated delivery
orderSchema.methods.calculateEstimatedDelivery = function() {
    const now = new Date();
    let deliveryDays = 0;
    
    switch (this.shippingMethod) {
        case 'standard':
            deliveryDays = 7;
            break;
        case 'express':
            deliveryDays = 3;
            break;
        case 'overnight':
            deliveryDays = 1;
            break;
        default:
            deliveryDays = 7;
    }
    
    const estimatedDate = new Date(now);
    estimatedDate.setDate(now.getDate() + deliveryDays);
    
    // Skip weekends for business days calculation
    while (estimatedDate.getDay() === 0 || estimatedDate.getDay() === 6) {
        estimatedDate.setDate(estimatedDate.getDate() + 1);
    }
    
    this.estimatedDelivery = estimatedDate;
    return estimatedDate;
};

// Instance method to process refund
orderSchema.methods.processRefund = function(amount, reason = '') {
    if (amount > this.total - this.refundAmount) {
        throw new Error('Refund amount cannot exceed remaining order total');
    }
    
    this.refundAmount += amount;
    this.refundDate = new Date();
    
    if (this.paymentInfo) {
        this.paymentInfo.refundAmount = this.refundAmount;
        this.paymentInfo.refundDate = this.refundDate;
        
        if (this.refundAmount >= this.total) {
            this.paymentInfo.status = 'refunded';
        } else {
            this.paymentInfo.status = 'partially_refunded';
        }
    }
    
    this.addTrackingUpdate('returned', `Refund processed: $${amount.toFixed(2)}. Reason: ${reason}`);
    
    return this.save();
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, options = {}) {
    const {
        page = 1,
        limit = 10,
        status,
        startDate,
        endDate
    } = options;
    
    const filter = { user: userId };
    
    if (status) filter.status = status;
    if (startDate || endDate) {
        filter.orderDate = {};
        if (startDate) filter.orderDate.$gte = new Date(startDate);
        if (endDate) filter.orderDate.$lte = new Date(endDate);
    }
    
    return this.find(filter)
        .sort({ orderDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('items.product', 'name images slug');
};

// Static method to find recent orders
orderSchema.statics.findRecent = function(limit = 10) {
    return this.find()
        .sort({ orderDate: -1 })
        .limit(limit)
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name');
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function(startDate, endDate) {
    const matchStage = {};
    if (startDate || endDate) {
        matchStage.orderDate = {};
        if (startDate) matchStage.orderDate.$gte = new Date(startDate);
        if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }
    
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
                averageOrderValue: { $avg: '$total' },
                totalItems: { $sum: { $sum: '$items.quantity' } }
            }
        }
    ]);
    
    const statusStats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    return {
        overall: stats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalItems: 0
        },
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {})
    };
};

module.exports = mongoose.model('Order', orderSchema); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const addressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['billing', 'shipping', 'both'],
        default: 'both'
    },
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
    zipCode: {
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
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const wishlistItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    avatar: {
        url: String,
        cloudinaryId: String
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'moderator'],
        default: 'customer'
    },
    addresses: [addressSchema],
    preferences: {
        newsletter: {
            type: Boolean,
            default: true
        },
        promotions: {
            type: Boolean,
            default: true
        },
        orderUpdates: {
            type: Boolean,
            default: true
        },
        currency: {
            type: String,
            enum: ['USD', 'EUR', 'GBP', 'CAD'],
            default: 'USD'
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    wishlist: [wishlistItemSchema],
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    recentlyViewed: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    orderCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    refreshTokens: [{
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        isActive: { type: Boolean, default: true }
    }]
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.verificationToken;
            delete ret.verificationExpires;
            delete ret.refreshTokens;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for customer tier based on total spent
userSchema.virtual('customerTier').get(function() {
    if (this.totalSpent >= 5000) return 'platinum';
    if (this.totalSpent >= 2000) return 'gold';
    if (this.totalSpent >= 500) return 'silver';
    return 'bronze';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to handle address defaults
userSchema.pre('save', function(next) {
    // Ensure only one default address
    if (this.isModified('addresses')) {
        let hasDefault = false;
        this.addresses.forEach(address => {
            if (address.isDefault) {
                if (hasDefault) {
                    address.isDefault = false;
                } else {
                    hasDefault = true;
                }
            }
        });
        
        // If no default address and addresses exist, make first one default
        if (!hasDefault && this.addresses.length > 0) {
            this.addresses[0].isDefault = true;
        }
    }
    
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '24h'
    });
};

userSchema.methods.generateRefreshToken = function() {
    const payload = {
        id: this._id,
        type: 'refresh'
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
    
    // Store refresh token
    this.refreshTokens.push({
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    return token;
};

userSchema.methods.removeRefreshToken = function(token) {
    this.refreshTokens = this.refreshTokens.filter(
        refreshToken => refreshToken.token !== token
    );
};

userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    this.passwordResetToken = resetToken;
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

userSchema.methods.generateVerificationToken = function() {
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    
    this.verificationToken = verificationToken;
    this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
};

userSchema.methods.incrementLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // If we have max attempts and it's not locked, lock the account
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

userSchema.methods.addToWishlist = function(productId) {
    const existingItem = this.wishlist.find(
        item => item.product.toString() === productId.toString()
    );
    
    if (!existingItem) {
        this.wishlist.push({ product: productId });
        return this.save();
    }
    
    return Promise.resolve(this);
};

userSchema.methods.removeFromWishlist = function(productId) {
    this.wishlist = this.wishlist.filter(
        item => item.product.toString() !== productId.toString()
    );
    return this.save();
};

userSchema.methods.addToCart = async function(productId, quantity = 1) {
    const existingItem = this.cart.find(item => 
        item.product.toString() === productId.toString()
    );

    if (existingItem) {
        // Update existing item quantity
        existingItem.quantity += quantity;
    } else {
        // Add new item to cart
        this.cart.push({
            product: productId,
            quantity,
            addedAt: new Date()
        });
    }

    return this.save();
};

userSchema.methods.updateCartItem = async function(productId, quantity) {
    if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        this.cart = this.cart.filter(item => 
            item.product.toString() !== productId.toString()
        );
    } else {
        const existingItem = this.cart.find(item => 
            item.product.toString() === productId.toString()
        );

        if (existingItem) {
            existingItem.quantity = quantity;
        } else if (quantity > 0) {
            // Add new item if it doesn't exist and quantity is positive
            this.cart.push({
                product: productId,
                quantity,
                addedAt: new Date()
            });
        }
    }

    return this.save();
};

userSchema.methods.clearCart = async function() {
    this.cart = [];
    return this.save();
};

userSchema.methods.addToRecentlyViewed = async function(productId) {
    // Remove product if it already exists in recently viewed
    this.recentlyViewed = this.recentlyViewed.filter(item => 
        item.product.toString() !== productId.toString()
    );

    // Add to beginning of array
    this.recentlyViewed.unshift({
        product: productId,
        viewedAt: new Date()
    });

    // Keep only last 20 items
    if (this.recentlyViewed.length > 20) {
        this.recentlyViewed = this.recentlyViewed.slice(0, 20);
    }

    return this.save();
};

userSchema.methods.addLoyaltyPoints = function(points) {
    this.loyaltyPoints += points;
    return this.save();
};

userSchema.methods.spendLoyaltyPoints = function(points) {
    if (this.loyaltyPoints >= points) {
        this.loyaltyPoints -= points;
        return this.save();
    }
    throw new Error('Insufficient loyalty points');
};

userSchema.methods.updateOrderStats = function(orderTotal) {
    this.orderCount += 1;
    this.totalSpent += orderTotal;
    
    // Add loyalty points (1 point per dollar spent)
    const pointsToAdd = Math.floor(orderTotal);
    this.loyaltyPoints += pointsToAdd;
    
    return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

userSchema.statics.findByRole = function(role) {
    return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema); 
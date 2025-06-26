const bcrypt = require('bcryptjs');
const User = require('../models/User');
const database = require('../config/database');

async function createAdminUser() {
    try {
        // Connect to database
        await database.connect();
        console.log('📡 Connected to database');

        // Delete existing admin if exists
        await User.deleteOne({ email: 'admin@techcore.com' });
        console.log('🗑️ Removed existing admin user');

        // Create admin user - DON'T hash password manually, let the User model do it
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'TechCore',
            email: 'admin@techcore.com',
            password: 'admin123456', // This will be hashed by the pre-save middleware
            role: 'admin',
            isVerified: true,
            profile: {
                bio: 'TechCore Administrator',
                preferences: {
                    newsletter: false,
                    promotions: false,
                    orderUpdates: true
                }
            },
            addresses: [{
                type: 'billing',
                firstName: 'Admin',
                lastName: 'TechCore',
                company: 'TechCore Inc.',
                address1: '123 Tech Street',
                city: 'San Francisco',
                state: 'CA',
                postalCode: '94105',
                zipCode: '94105',
                country: 'US',
                isDefault: true
            }]
        });

        await adminUser.save();
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@techcore.com');
        console.log('🔑 Password: admin123456');
        console.log('⚠️  Please change the password after first login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createAdminUser();
}

module.exports = createAdminUser; 
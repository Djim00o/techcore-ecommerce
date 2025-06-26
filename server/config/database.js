const mongoose = require('mongoose');

class Database {
    constructor() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
    }

    async connect() {
        if (this.isConnected) {
            console.log('Database already connected');
            return;
        }

        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techcore_ecommerce';
        
        const options = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            family: 4 // Use IPv4, skip trying IPv6
        };

        try {
            await mongoose.connect(mongoURI, options);
            this.isConnected = true;
            this.connectionAttempts = 0;
            console.log(`✅ MongoDB connected: ${mongoURI}`);
            
            // Handle connection events
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            await this.handleConnectionError();
        }
    }

    setupEventHandlers() {
        mongoose.connection.on('disconnected', () => {
            console.log('📡 MongoDB disconnected');
            this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
            this.isConnected = true;
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB error:', error);
            this.isConnected = false;
        });

        // Graceful shutdown
        process.on('SIGINT', this.gracefulShutdown);
        process.on('SIGTERM', this.gracefulShutdown);
    }

    async handleConnectionError() {
        this.connectionAttempts++;
        
        if (this.connectionAttempts >= this.maxRetries) {
            console.error(`❌ Failed to connect to MongoDB after ${this.maxRetries} attempts`);
            process.exit(1);
        }

        console.log(`🔄 Retrying connection in ${this.retryDelay / 1000} seconds... (Attempt ${this.connectionAttempts}/${this.maxRetries})`);
        
        setTimeout(() => {
            this.connect();
        }, this.retryDelay);
    }

    async gracefulShutdown() {
        console.log('\n🔄 Shutting down gracefully...');
        
        try {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('✅ MongoDB disconnected successfully');
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }

    async healthCheck() {
        try {
            const adminDb = mongoose.connection.db.admin();
            const result = await adminDb.ping();
            return {
                status: 'healthy',
                database: mongoose.connection.name,
                timestamp: new Date().toISOString(),
                ping: result
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Create and export singleton instance
const database = new Database();

module.exports = database; 
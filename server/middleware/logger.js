const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logger utility functions
const getTimestamp = () => {
    return new Date().toISOString();
};

const getClientIP = (req) => {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           'unknown';
};

const getUserAgent = (req) => {
    return req.headers['user-agent'] || 'unknown';
};

// Console logger with colors
const logToConsole = (level, message, meta = {}) => {
    const colors = {
        info: '\x1b[36m',    // cyan
        warn: '\x1b[33m',    // yellow
        error: '\x1b[31m',   // red
        debug: '\x1b[35m',   // magenta
        success: '\x1b[32m'  // green
    };
    
    const reset = '\x1b[0m';
    const timestamp = getTimestamp();
    const color = colors[level] || '';
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
    
    if (Object.keys(meta).length > 0) {
        console.log(`${color}Meta:${reset}`, meta);
    }
};

// File logger
const logToFile = (level, message, meta = {}) => {
    const timestamp = getTimestamp();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(logsDir, `${level}.log`);
    
    fs.appendFile(logFile, logLine, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
    
    // Also write to combined log
    const combinedFile = path.join(logsDir, 'combined.log');
    fs.appendFile(combinedFile, logLine, () => {});
};

// Logger class
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
    }
    
    shouldLog(level) {
        const levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        return levels[level] <= levels[this.logLevel];
    }
    
    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;
        
        logToConsole(level, message, meta);
        
        if (this.enableFileLogging) {
            logToFile(level, message, meta);
        }
    }
    
    info(message, meta = {}) {
        this.log('info', message, meta);
    }
    
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }
    
    error(message, meta = {}) {
        this.log('error', message, meta);
    }
    
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }
    
    success(message, meta = {}) {
        logToConsole('success', message, meta);
        
        if (this.enableFileLogging) {
            logToFile('info', message, { type: 'success', ...meta });
        }
    }
}

// Create logger instance
const logger = new Logger();

// HTTP request logger middleware
const loggerMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    // Log incoming request
    logger.info(`${req.method} ${req.originalUrl}`, {
        ip,
        userAgent,
        body: req.method !== 'GET' ? req.body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        user: req.user ? { id: req.user._id, email: req.user.email } : undefined
    });
    
    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Determine log level based on status code
        let logLevel = 'info';
        if (statusCode >= 400 && statusCode < 500) {
            logLevel = 'warn';
        } else if (statusCode >= 500) {
            logLevel = 'error';
        }
        
        logger.log(logLevel, `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`, {
            ip,
            statusCode,
            duration,
            responseSize: JSON.stringify(data).length,
            user: req.user ? { id: req.user._id, email: req.user.email } : undefined
        });
        
        // Call original json method
        return originalJson.call(this, data);
    };
    
    next();
};

// Security event logger
const logSecurityEvent = (event, details = {}) => {
    logger.warn(`Security Event: ${event}`, {
        type: 'security',
        event,
        ...details,
        timestamp: getTimestamp()
    });
    
    // Also log to security-specific file
    if (logger.enableFileLogging) {
        const securityFile = path.join(logsDir, 'security.log');
        const logEntry = JSON.stringify({
            timestamp: getTimestamp(),
            event,
            ...details
        }) + '\n';
        
        fs.appendFile(securityFile, logEntry, () => {});
    }
};

// Error logger
const logError = (error, context = {}) => {
    logger.error(error.message || error, {
        type: 'error',
        stack: error.stack,
        ...context,
        timestamp: getTimestamp()
    });
};

// Performance logger
const logPerformance = (operation, duration, details = {}) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger.log(level, `Performance: ${operation} took ${duration}ms`, {
        type: 'performance',
        operation,
        duration,
        ...details
    });
};

// Database operation logger
const logDatabaseOperation = (operation, collection, duration, details = {}) => {
    logger.debug(`DB: ${operation} on ${collection} - ${duration}ms`, {
        type: 'database',
        operation,
        collection,
        duration,
        ...details
    });
};

// API usage logger
const logAPIUsage = (endpoint, user, details = {}) => {
    logger.info(`API Usage: ${endpoint}`, {
        type: 'api_usage',
        endpoint,
        user: user ? { id: user._id, email: user.email, role: user.role } : null,
        ...details,
        timestamp: getTimestamp()
    });
};

// Log rotation (called daily via cron or scheduler)
const rotateLog = (logFileName) => {
    const logFile = path.join(logsDir, logFileName);
    const rotatedFile = path.join(logsDir, `${logFileName}.${new Date().toISOString().split('T')[0]}`);
    
    if (fs.existsSync(logFile)) {
        fs.rename(logFile, rotatedFile, (err) => {
            if (err) {
                logger.error('Failed to rotate log file', { file: logFileName, error: err.message });
            } else {
                logger.info('Log file rotated', { original: logFileName, rotated: rotatedFile });
            }
        });
    }
};

// Clean old logs (keep last 30 days)
const cleanOldLogs = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    fs.readdir(logsDir, (err, files) => {
        if (err) return;
        
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            logger.info('Old log file deleted', { file });
                        }
                    });
                }
            });
        });
    });
};

module.exports = {
    logger,
    loggerMiddleware,
    logSecurityEvent,
    logError,
    logPerformance,
    logDatabaseOperation,
    logAPIUsage,
    rotateLog,
    cleanOldLogs
}; 
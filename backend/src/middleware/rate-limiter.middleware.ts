import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Increased limit for development
    message: {
        success: false,
        error: 'Too many login attempts, please try again later'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Increased from 3 to 100 for testing
    message: {
        success: false,
        error: 'Too many OTP requests from this IP, please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

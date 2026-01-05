import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import customersRoutes from './routes/customers.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import purchasesRoutes from './routes/purchases.routes.js';
import salesRoutes from './routes/sales.routes.js';
import expensesRoutes from './routes/expenses.routes.js';
import jobsheetsRoutes from './routes/jobsheets.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

import { loginLimiter, otpLimiter } from './middleware/rate-limiter.middleware.js';

// Security Headers
app.use(helmet());

// Middleware - Allow all origins for cross-device access
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.log(`⚠️ SLOW REQUEST: ${req.method} ${req.url} took ${duration}ms`);
        } else {
            console.log(`${req.method} ${req.url} took ${duration}ms`);
        }
    });
    next();
});

// Apply rate limiting
app.use('/api/auth/login', loginLimiter);
// app.use('/api/auth/request-otp', otpLimiter);
app.use('/api/auth/verify-otp-reset', loginLimiter); // Prevent guessing OTPs

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/jobsheets', jobsheetsRoutes);
app.use('/api/invoices', invoicesRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;

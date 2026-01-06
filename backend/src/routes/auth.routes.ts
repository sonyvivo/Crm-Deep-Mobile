
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { EmailService } from '../services/email.service.js';

const router = Router();
const emailService = new EmailService();

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(`\n--- Login Attempt: ${req.body.username} ---`);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const users = await sql`SELECT * FROM users WHERE username = ${username}`;

    if (users.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check Password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username }
    });
}));

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req: AuthRequest, res: Response) => {
    res.json({
        success: true,
        user: { id: req.userId, username: req.username }
    });
});

// POST /api/auth/register (admin only - first user setup)
router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    // Check if any users exist
    const existingUsers = await sql`SELECT count(*) FROM users`;
    if (existingUsers[0].count > 0) {
        return res.status(403).json({ success: false, error: 'Registration disabled. Users already exist.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultPin = '1234';
    const pinHash = await bcrypt.hash(defaultPin, 10);
    // Default recovery key for new user
    const recoveryKeyHash = await bcrypt.hash('secret', 10);

    const newUser = await sql`
        INSERT INTO users (username, password_hash, pin, recovery_key_hash)
        VALUES (${username}, ${passwordHash}, ${pinHash}, ${recoveryKeyHash})
        RETURNING id, username, created_at
    `;

    const user = newUser[0];

    const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    res.status(201).json({
        success: true,
        token,
        user
    });
}));

// POST /api/auth/reset-password - Reset Password using Recovery Key
router.post('/reset-password', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, recoveryKey, newPassword } = req.body;

    if (!username || !recoveryKey || !newPassword) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const users = await sql`SELECT * FROM users WHERE username = ${username}`;

    if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = users[0];

    if (!user.recovery_key_hash) {
        return res.status(400).json({ success: false, error: 'Recovery key not set for this account' });
    }

    const isValidKey = await bcrypt.compare(recoveryKey, user.recovery_key_hash);
    if (!isValidKey) {
        return res.status(401).json({ success: false, error: 'Invalid recovery key' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await sql`UPDATE users SET password_hash = ${newPasswordHash} WHERE id = ${user.id}`;

    res.json({ success: true, message: 'Password reset successfully' });
}));

// GET /api/auth/bootstrap - Fetch all essential data
router.get('/bootstrap', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(`\n--- Bootstrap Request: ${req.username} ---`);
    const start = Date.now();

    try {
        const [
            customers,
            suppliers,
            purchases,
            sales,
            expenses,
            jobsheets,
            invoices
        ] = await Promise.all([
            sql`SELECT * FROM customers ORDER BY created_at DESC`,
            sql`SELECT * FROM suppliers ORDER BY name ASC`,
            sql`SELECT * FROM purchases ORDER BY date DESC`,
            sql`SELECT * FROM sales ORDER BY date DESC`,
            sql`SELECT * FROM expenses ORDER BY date DESC`,
            sql`SELECT * FROM job_sheets ORDER BY date DESC`,
            sql`SELECT * FROM invoices ORDER BY date DESC`
        ]);

        console.log(`Bootstrap Data Fetch took: ${Date.now() - start}ms`);

        res.json({
            success: true,
            data: {
                customers,
                suppliers: suppliers.map((s: any) => s.name),
                purchases,
                sales,
                expenses,
                jobsheets,
                invoices
            }
        });
    } catch (error) {
        console.error('Bootstrap failed:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bootstrap data' });
    }
}));


// --- PIN Management Routes ---

// POST /api/auth/pin/verify
router.post('/pin/verify', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, error: 'PIN required' });

    // userId is string from token (or number if strict, but let's assume loose since SQL returns number ID)
    const users = await sql`SELECT pin FROM users WHERE id = ${req.userId}`;

    if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const storedPin = users[0].pin;
    let isValid = false;

    if (storedPin && storedPin.startsWith('$2')) {
        isValid = await bcrypt.compare(pin, storedPin);
    } else {
        isValid = storedPin === pin;
        if (isValid) {
            const hashedPin = await bcrypt.hash(pin, 10);
            await sql`UPDATE users SET pin = ${hashedPin} WHERE id = ${req.userId}`;
        }
    }
    res.json({ success: true, valid: isValid });
}));

// POST /api/auth/pin/change
router.post('/pin/change', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { oldPin, newPin } = req.body;
    if (!oldPin || !newPin) return res.status(400).json({ success: false, error: 'Old and New PIN required' });
    if (newPin.length < 4 || newPin.length > 10) return res.status(400).json({ success: false, error: 'PIN must be 4-10 chars' });

    const users = await sql`SELECT pin FROM users WHERE id = ${req.userId}`;
    if (users.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    const storedPin = users[0].pin;
    let isOldPinValid = false;
    if (storedPin && storedPin.startsWith('$2')) {
        isOldPinValid = await bcrypt.compare(oldPin, storedPin);
    } else {
        isOldPinValid = storedPin === oldPin;
    }

    if (!isOldPinValid) return res.status(401).json({ success: false, error: 'Invalid old PIN' });

    const hashedNewPin = await bcrypt.hash(newPin, 10);
    await sql`UPDATE users SET pin = ${hashedNewPin} WHERE id = ${req.userId}`;
    res.json({ success: true, message: 'PIN changed successfully' });
}));

// POST /api/auth/pin/reset
router.post('/pin/reset', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });

    const users = await sql`SELECT password_hash FROM users WHERE id = ${req.userId}`;
    if (users.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    const isValidPassword = await bcrypt.compare(password, users[0].password_hash);
    if (!isValidPassword) return res.status(401).json({ success: false, error: 'Invalid password' });

    const defaultPin = '1234';
    const hashedDefaultPin = await bcrypt.hash(defaultPin, 10);
    await sql`UPDATE users SET pin = ${hashedDefaultPin} WHERE id = ${req.userId}`;
    res.json({ success: true, message: 'PIN reset to default (1234)', pin: defaultPin });
}));

// GET /api/auth/pin
router.get('/pin', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await sql`SELECT pin FROM users WHERE id = ${req.userId}`;
    if (users.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, pin: users[0].pin || '1234' });
}));


export default router;

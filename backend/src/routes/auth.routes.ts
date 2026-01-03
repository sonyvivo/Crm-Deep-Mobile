import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password required'
        });
    }

    const users = await sql`
    SELECT id, username, password_hash FROM users WHERE username = ${username}
  `;

    if (users.length === 0) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
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
        return res.status(400).json({
            success: false,
            error: 'Username and password required'
        });
    }

    // Check if any users exist
    const existingUsers = await sql`SELECT COUNT(*) as count FROM users`;
    if (parseInt(existingUsers[0].count) > 0) {
        return res.status(403).json({
            success: false,
            error: 'Registration disabled. Users already exist.'
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id, username
  `;

    const token = jwt.sign(
        { userId: result[0].id, username: result[0].username },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    res.status(201).json({
        success: true,
        token,
        user: result[0]
    });
}));

// POST /api/auth/pin/verify - Verify PIN
router.post('/pin/verify', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pin } = req.body;

    if (!pin) {
        return res.status(400).json({ success: false, error: 'PIN required' });
    }

    const users = await sql`SELECT pin FROM users WHERE id = ${req.userId}`;

    if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = users[0].pin === pin;
    res.json({ success: true, valid: isValid });
}));

// POST /api/auth/pin/change - Change PIN
router.post('/pin/change', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
        return res.status(400).json({ success: false, error: 'Old PIN and new PIN required' });
    }

    if (newPin.length < 4 || newPin.length > 10) {
        return res.status(400).json({ success: false, error: 'PIN must be 4-10 characters' });
    }

    const users = await sql`SELECT pin FROM users WHERE id = ${req.userId}`;

    if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (users[0].pin !== oldPin) {
        return res.status(401).json({ success: false, error: 'Invalid old PIN' });
    }

    await sql`UPDATE users SET pin = ${newPin} WHERE id = ${req.userId}`;
    res.json({ success: true, message: 'PIN changed successfully' });
}));

// POST /api/auth/pin/reset - Reset PIN to default (requires password)
router.post('/pin/reset', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, error: 'Password required to reset PIN' });
    }

    const users = await sql`SELECT password_hash FROM users WHERE id = ${req.userId}`;

    if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, users[0].password_hash);

    if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    const defaultPin = '1234';
    await sql`UPDATE users SET pin = ${defaultPin} WHERE id = ${req.userId}`;
    res.json({ success: true, message: 'PIN reset to default (1234)', pin: defaultPin });
}));

// GET /api/auth/pin - Get current PIN (for authenticated user)
router.get('/pin', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await sql`SELECT pin FROM users WHERE id = ${req.userId}`;

    if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, pin: users[0].pin || '1234' });
}));

export default router;

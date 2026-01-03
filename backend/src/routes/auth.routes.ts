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

export default router;

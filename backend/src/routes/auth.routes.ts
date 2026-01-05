import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { EmailService } from '../services/email.service.js';
const router = Router();
const emailService = new EmailService();
// Client ID from User - Removed

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(`\n--- Login Attempt: ${req.body.username} ---`);
    const startTotal = Date.now();
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password required'
        });
    }

    const dbStart = Date.now();
    const users = await sql`
    SELECT id, username, password_hash FROM users WHERE username = ${username}
  `;
    console.log(`DB Query took: ${Date.now() - dbStart}ms`);

    if (users.length === 0) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }

    const user = users[0];
    const bcryptStart = Date.now();
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`Bcrypt compare took: ${Date.now() - bcryptStart}ms`);

    if (!isValidPassword) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }

    const tokenStart = Date.now();
    const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );
    console.log(`JWT Sign took: ${Date.now() - tokenStart}ms`);

    console.log(`Total Login Time: ${Date.now() - startTotal}ms`);
    console.log('-------------------------------\n');

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
    const defaultPin = '1234';
    const pinHash = await bcrypt.hash(defaultPin, 10);

    const result = await sql`
    INSERT INTO users (username, password_hash, pin)
    VALUES (${username}, ${passwordHash}, ${pinHash})
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

    // Check if it's already a bcrypt hash (starts with $2)
    const storedPin = users[0].pin;
    let isValid = false;
    if (storedPin && storedPin.startsWith('$2')) {
        isValid = await bcrypt.compare(pin, storedPin);
    } else {
        // Legacy support for plaintext PIN
        isValid = storedPin === pin;
        // Auto-upgrade to hashed PIN if valid
        if (isValid) {
            const hashedPin = await bcrypt.hash(pin, 10);
            await sql`UPDATE users SET pin = ${hashedPin} WHERE id = ${req.userId}`;
        }
    }
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

    const storedPin = users[0].pin;
    let isOldPinValid = false;
    if (storedPin && storedPin.startsWith('$2')) {
        isOldPinValid = await bcrypt.compare(oldPin, storedPin);
    } else {
        isOldPinValid = storedPin === oldPin;
    }

    if (!isOldPinValid) {
        return res.status(401).json({ success: false, error: 'Invalid old PIN' });
    }

    const hashedNewPin = await bcrypt.hash(newPin, 10);
    await sql`UPDATE users SET pin = ${hashedNewPin} WHERE id = ${req.userId}`;
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
    const hashedDefaultPin = await bcrypt.hash(defaultPin, 10);
    await sql`UPDATE users SET pin = ${hashedDefaultPin} WHERE id = ${req.userId}`;
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

// POST /api/auth/request-otp - Request Password Reset OTP
router.post('/request-otp', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const users = await sql`SELECT id, email FROM users WHERE username = ${username}`;

    if (users.length === 0) {
        // Return success even if user not found to prevent enumeration
        return res.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    const user = users[0];
    if (!user.email) {
        return res.status(400).json({ success: false, error: 'No email linked to this account.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP hash and expiry
    await sql`
        UPDATE users 
        SET otp_hash = ${otpHash}, otp_expires_at = ${expiresAt}
        WHERE id = ${user.id}
    `;

    // Send Email
    console.log(`Attempting to send OTP to ${user.email}...`);
    const emailSent = await emailService.sendOTP(user.email, otp);

    if (!emailSent) {
        console.error(`❌ FAILED to send email to ${user.email}.`);
        console.log(`\n************************************************`);
        console.log(`DEBUG: OTP for ${username} is: ${otp}`);
        console.log(`************************************************\n`);

        // Return a mock success in dev mode so testing can continue
        return res.json({
            success: true,
            message: 'OTP sent successfully (MOCK MODE - Check Server Console).'
        });
    }

    res.json({ success: true, message: 'OTP sent successfully to your email.' });
}));

// POST /api/auth/verify-otp-reset - Reset Password using OTP
router.post('/verify-otp-reset', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, otp, newPassword } = req.body;

    if (!username || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const users = await sql`SELECT id, otp_hash, otp_expires_at FROM users WHERE username = ${username}`;

    if (users.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    const user = users[0];

    if (!user.otp_hash || !user.otp_expires_at) {
        return res.status(400).json({ success: false, error: 'No OTP request found. Please request a new OTP.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
        return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    const isValidOTP = await bcrypt.compare(otp, user.otp_hash);
    if (!isValidOTP) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await sql`
        UPDATE users 
        SET password_hash = ${newPasswordHash}, otp_hash = NULL, otp_expires_at = NULL
        WHERE id = ${user.id}
    `;

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
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

    const users = await sql`SELECT id, recovery_key_hash FROM users WHERE username = ${username}`;

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
    await sql`
        UPDATE users 
        SET password_hash = ${newPasswordHash}
        WHERE id = ${user.id}
    `;

    res.json({ success: true, message: 'Password reset successfully' });
}));


// GET /api/auth/bootstrap - Fetch all essential data for the app in one go
router.get('/bootstrap', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(`\n--- Bootstrap Request: ${req.username} ---`);
    const start = Date.now();

    try {
        // Fetch all data in parallel at the database level
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
            sql`SELECT name FROM suppliers ORDER BY name ASC`,
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


// POST /api/auth/google-login


export default router;

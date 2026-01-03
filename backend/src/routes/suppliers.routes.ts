import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/suppliers
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const suppliers = await sql`SELECT * FROM suppliers ORDER BY name`;
    res.json({ success: true, data: suppliers.map(s => s.name) });
}));

// POST /api/suppliers
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const result = await sql`
    INSERT INTO suppliers (name) VALUES (${name})
    ON CONFLICT (name) DO NOTHING
    RETURNING *
  `;

    res.status(201).json({ success: true, data: result[0] || { name } });
}));

// DELETE /api/suppliers/:name
router.delete('/:name', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.params;

    await sql`DELETE FROM suppliers WHERE name = ${name}`;
    res.json({ success: true, message: 'Supplier deleted' });
}));

export default router;

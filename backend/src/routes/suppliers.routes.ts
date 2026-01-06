import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/suppliers
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const suppliers = await sql`SELECT name FROM suppliers ORDER BY name ASC`;
    res.json({ success: true, data: suppliers.map((s: any) => s.name) });
}));

// POST /api/suppliers
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
    }

    // Check conflict (name is unique)
    const existing = await sql`SELECT * FROM suppliers WHERE name = ${name}`;
    if (existing.length > 0) {
        return res.status(201).json({ success: true, data: existing[0] });
    }

    const newSupplier = await sql`INSERT INTO suppliers (name) VALUES (${name}) RETURNING id, name`;

    res.status(201).json({ success: true, data: newSupplier[0] });
}));

// DELETE /api/suppliers/:name
router.delete('/:name', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.params;

    const result = await sql`DELETE FROM suppliers WHERE name = ${name} RETURNING name`;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({ success: true, message: 'Supplier deleted' });
}));

export default router;

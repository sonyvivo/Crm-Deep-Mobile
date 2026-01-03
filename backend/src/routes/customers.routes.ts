import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/customers
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const customers = await sql`
    SELECT * FROM customers ORDER BY created_at DESC
  `;
    res.json({ success: true, data: customers });
}));

// GET /api/customers/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const customers = await sql`
    SELECT * FROM customers WHERE id = ${id}
  `;

    if (customers.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customers[0] });
}));

// POST /api/customers
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, name, mobile, address, notes } = req.body;

    if (!id || !name) {
        return res.status(400).json({ success: false, error: 'ID and name are required' });
    }

    const result = await sql`
    INSERT INTO customers (id, name, mobile, address, notes)
    VALUES (${id}, ${name}, ${mobile || null}, ${address || null}, ${notes || null})
    RETURNING *
  `;

    res.status(201).json({ success: true, data: result[0] });
}));

// PUT /api/customers/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, mobile, address, notes } = req.body;

    const result = await sql`
    UPDATE customers 
    SET name = ${name}, mobile = ${mobile || null}, address = ${address || null}, notes = ${notes || null}
    WHERE id = ${id}
    RETURNING *
  `;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: result[0] });
}));

// DELETE /api/customers/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await sql`
    DELETE FROM customers WHERE id = ${id} RETURNING id
  `;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted' });
}));

export default router;

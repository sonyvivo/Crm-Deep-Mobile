import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/expenses
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const expenses = await sql`SELECT * FROM expenses ORDER BY date DESC`;
    res.json({ success: true, data: expenses });
}));

// GET /api/expenses/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const items = await sql`SELECT * FROM expenses WHERE id = ${id}`;

    if (items.length === 0) {
        return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: items[0] });
}));

// POST /api/expenses
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, date, category, description, vendor, amount, paymentMode, receipt, receiptNumber, notes } = req.body;

    const result = await sql`
    INSERT INTO expenses (id, date, category, description, vendor, amount, payment_mode, receipt, receipt_number, notes)
    VALUES (${id}, ${date}, ${category}, ${description}, ${vendor || null}, ${amount}, ${paymentMode}, 
      ${receipt || null}, ${receiptNumber || null}, ${notes || null})
    RETURNING *
  `;

    res.status(201).json({ success: true, data: result[0] });
}));

// PUT /api/expenses/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { date, category, description, vendor, amount, paymentMode, receipt, receiptNumber, notes } = req.body;

    const result = await sql`
    UPDATE expenses SET
      date = ${date}, category = ${category}, description = ${description}, vendor = ${vendor || null},
      amount = ${amount}, payment_mode = ${paymentMode}, receipt = ${receipt || null}, 
      receipt_number = ${receiptNumber || null}, notes = ${notes || null}
    WHERE id = ${id}
    RETURNING *
  `;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: result[0] });
}));

// DELETE /api/expenses/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await sql`DELETE FROM expenses WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, message: 'Expense deleted' });
}));

export default router;

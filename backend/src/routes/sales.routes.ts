import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/sales
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const sales = await sql`SELECT * FROM sales ORDER BY date DESC`;
    res.json({ success: true, data: sales });
}));

// GET /api/sales/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const items = await sql`SELECT * FROM sales WHERE id = ${id}`;

    if (items.length === 0) {
        return res.status(404).json({ success: false, error: 'Sale not found' });
    }
    res.json({ success: true, data: items[0] });
}));

// POST /api/sales
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, date, customer, customerMobile, deviceBrand, deviceModel, problem, partName, partNameOther,
        unitPrice, purchaseCost, profit, totalAmount, notes, paymentMode, pendingAmount } = req.body;

    const result = await sql`
    INSERT INTO sales (id, date, customer, customer_mobile, device_brand, device_model, problem, part_name, 
      part_name_other, unit_price, purchase_cost, profit, total_amount, notes, payment_mode, pending_amount)
    VALUES (${id}, ${date}, ${customer}, ${customerMobile || null}, ${deviceBrand}, ${deviceModel || null}, 
      ${problem || null}, ${partName}, ${partNameOther || null}, ${unitPrice}, ${purchaseCost}, ${profit}, 
      ${totalAmount}, ${notes || null}, ${paymentMode}, ${pendingAmount || 0})
    RETURNING *
  `;

    res.status(201).json({ success: true, data: result[0] });
}));

// PUT /api/sales/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { date, customer, customerMobile, deviceBrand, deviceModel, problem, partName, partNameOther,
        unitPrice, purchaseCost, profit, totalAmount, notes, paymentMode, pendingAmount } = req.body;

    const result = await sql`
    UPDATE sales SET
      date = ${date}, customer = ${customer}, customer_mobile = ${customerMobile || null}, 
      device_brand = ${deviceBrand}, device_model = ${deviceModel || null}, problem = ${problem || null},
      part_name = ${partName}, part_name_other = ${partNameOther || null}, unit_price = ${unitPrice},
      purchase_cost = ${purchaseCost}, profit = ${profit}, total_amount = ${totalAmount}, 
      notes = ${notes || null}, payment_mode = ${paymentMode}, pending_amount = ${pendingAmount || 0}
    WHERE id = ${id}
    RETURNING *
  `;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Sale not found' });
    }
    res.json({ success: true, data: result[0] });
}));

// DELETE /api/sales/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await sql`DELETE FROM sales WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Sale not found' });
    }
    res.json({ success: true, message: 'Sale deleted' });
}));

export default router;

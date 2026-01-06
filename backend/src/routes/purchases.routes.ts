import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/purchases
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const purchases = await sql`SELECT * FROM purchases ORDER BY date DESC`;
    res.json({ success: true, data: purchases });
}));

// GET /api/purchases/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const purchases = await sql`SELECT * FROM purchases WHERE id = ${id}`;

    if (purchases.length === 0) {
        return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    res.json({ success: true, data: purchases[0] });
}));

// POST /api/purchases
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, date, supplier, deviceBrand, deviceModel, partName, partNameOther, unitPrice, totalAmount, notes } = req.body;

    const newPurchase = {
        id,
        date,
        supplier,
        device_brand: deviceBrand,
        device_model: deviceModel || null,
        part_name: partName,
        part_name_other: partNameOther || null,
        unit_price: unitPrice,
        total_amount: totalAmount,
        notes: notes || null,
        created_at: new Date().toISOString()
    };

    await sql`
        INSERT INTO purchases (id, date, supplier, device_brand, device_model, part_name, part_name_other, unit_price, total_amount, notes, created_at)
        VALUES (${newPurchase.id}, ${newPurchase.date}, ${newPurchase.supplier}, ${newPurchase.device_brand}, ${newPurchase.device_model}, ${newPurchase.part_name}, ${newPurchase.part_name_other}, ${newPurchase.unit_price}, ${newPurchase.total_amount}, ${newPurchase.notes}, ${newPurchase.created_at})
    `;

    res.status(201).json({ success: true, data: newPurchase });
}));

// PUT /api/purchases/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { date, supplier, deviceBrand, deviceModel, partName, partNameOther, unitPrice, totalAmount, notes } = req.body;

    const purchases = await sql`SELECT * FROM purchases WHERE id = ${id}`;

    if (purchases.length === 0) {
        return res.status(404).json({ success: false, error: 'Purchase not found' });
    }

    const updatedPurchase = await sql`
        UPDATE purchases
        SET date = ${date}, supplier = ${supplier}, device_brand = ${deviceBrand}, device_model = ${deviceModel || null},
            part_name = ${partName}, part_name_other = ${partNameOther || null}, unit_price = ${unitPrice},
            total_amount = ${totalAmount}, notes = ${notes || null}
        WHERE id = ${id}
        RETURNING *
    `;

    res.json({ success: true, data: updatedPurchase[0] });
}));

// DELETE /api/purchases/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await sql`DELETE FROM purchases WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    res.json({ success: true, message: 'Purchase deleted' });
}));

export default router;

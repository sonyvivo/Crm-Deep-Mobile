import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/invoices
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoices = await sql`SELECT * FROM invoices ORDER BY date DESC`;
  res.json({ success: true, data: invoices });
}));

// GET /api/invoices/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const invoices = await sql`SELECT * FROM invoices WHERE id = ${id}`;

  if (invoices.length === 0) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }
  res.json({ success: true, data: invoices[0] });
}));

// POST /api/invoices
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const inv = req.body;

  const newInvoice = {
    id: inv.id,
    date: inv.date,
    customer_name: inv.customerName,
    customer_mobile: inv.customerMobile,
    customer_address: inv.customerAddress || null,
    device_type: inv.deviceType,
    device_brand: inv.deviceBrand,
    device_model: inv.deviceModel,
    device_imei: inv.deviceImei,
    device_issues: inv.deviceIssues,
    device_accessories: inv.deviceAccessories,
    items: JSON.stringify(inv.items), // Convert object/array to JSON string for JSONB column handling if needed, or driver handles it?
    // neon driver usually handles object -> JSONB automatically if column is JSONB. 
    // Let's pass object directly.
    // Wait, inv.items is array.
    subtotal: inv.subtotal,
    tax_percent: inv.taxPercent,
    discount: inv.discount,
    total_amount: inv.totalAmount,
    payment_status: inv.paymentStatus,
    amount_paid: inv.amountPaid,
    balance_due: inv.balanceDue,
    warranty_info: inv.warrantyInfo,
    technician_notes: inv.technicianNotes || null,
    created_at: new Date().toISOString()
  };

  // Note: items column in schema is JSONB. Pass raw array/object.
  await sql`
        INSERT INTO invoices (
            id, date, customer_name, customer_mobile, customer_address, device_type, device_brand, device_model,
            device_imei, device_issues, device_accessories, items, subtotal, tax_percent, discount, total_amount,
            payment_status, amount_paid, balance_due, warranty_info, technician_notes, created_at
        ) VALUES (
            ${newInvoice.id}, ${newInvoice.date}, ${newInvoice.customer_name}, ${newInvoice.customer_mobile},
            ${newInvoice.customer_address}, ${newInvoice.device_type}, ${newInvoice.device_brand},
            ${newInvoice.device_model}, ${newInvoice.device_imei}, ${newInvoice.device_issues},
            ${newInvoice.device_accessories}, ${inv.items}::jsonb, ${newInvoice.subtotal}, ${newInvoice.tax_percent},
            ${newInvoice.discount}, ${newInvoice.total_amount}, ${newInvoice.payment_status}, ${newInvoice.amount_paid},
            ${newInvoice.balance_due}, ${newInvoice.warranty_info}, ${newInvoice.technician_notes}, ${newInvoice.created_at}
        )
    `;

  res.status(201).json({ success: true, data: { ...newInvoice, items: inv.items } });
}));

// PUT /api/invoices/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const inv = req.body;

  const invoices = await sql`SELECT * FROM invoices WHERE id = ${id}`;

  if (invoices.length === 0) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }

  const updatedInvoice = await sql`
        UPDATE invoices
        SET date = ${inv.date}, customer_name = ${inv.customerName}, customer_mobile = ${inv.customerMobile},
            customer_address = ${inv.customerAddress || null}, device_type = ${inv.deviceType},
            device_brand = ${inv.deviceBrand}, device_model = ${inv.deviceModel}, device_imei = ${inv.deviceImei},
            device_issues = ${inv.deviceIssues}, device_accessories = ${inv.deviceAccessories},
            items = ${inv.items}::jsonb, subtotal = ${inv.subtotal}, tax_percent = ${inv.taxPercent},
            discount = ${inv.discount}, total_amount = ${inv.totalAmount}, payment_status = ${inv.paymentStatus},
            amount_paid = ${inv.amountPaid}, balance_due = ${inv.balanceDue}, warranty_info = ${inv.warrantyInfo},
            technician_notes = ${inv.technicianNotes || null}
        WHERE id = ${id}
        RETURNING *
    `;

  res.json({ success: true, data: updatedInvoice[0] });
}));

// DELETE /api/invoices/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await sql`DELETE FROM invoices WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }
  res.json({ success: true, message: 'Invoice deleted' });
}));

export default router;

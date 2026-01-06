
import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/customers
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const customers = await sql`SELECT * FROM customers ORDER BY created_at DESC`;
  res.json({ success: true, data: customers });
}));

// GET /api/customers/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const customers = await sql`SELECT * FROM customers WHERE id = ${id}`;

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

  const newCustomer = {
    id,
    name,
    mobile: mobile || null,
    address: address || null,
    notes: notes || null,
    created_at: new Date().toISOString() // Or use SQL DEFAULT NOW() by omitting it, but keeping it consistent with FE logic?
    // DB default is NOW(). If I pass it, it uses passed value. Let's pass it to be explicit if FE expects syncing.
  };

  await sql`
    INSERT INTO customers (id, name, mobile, address, notes, created_at)
    VALUES (${newCustomer.id}, ${newCustomer.name}, ${newCustomer.mobile}, ${newCustomer.address}, ${newCustomer.notes}, ${newCustomer.created_at})
  `;

  res.status(201).json({ success: true, data: newCustomer });
}));

// PUT /api/customers/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, mobile, address, notes } = req.body;

  const customers = await sql`SELECT * FROM customers WHERE id = ${id}`;

  if (customers.length === 0) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  // Update
  // We should only update fields that are provided? The previous logic replaced fields or updated?
  // Previous logic: `await docRef.update(updates)`. Firestore update only updates provided fields.
  // SQL UPDATE updates specified columns. If I want partial update I need to be dynamic or just update all if frontend sends all.
  // The provided code destructures specific fields.
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (mobile !== undefined) updates.mobile = mobile || null;
  if (address !== undefined) updates.address = address || null;
  if (notes !== undefined) updates.notes = notes || null;

  // Simple SQL approach: Use the provided values, or keep existing?
  // Better: execute update.
  // `sql(...)` helper with `updates` object?
  // Neondb/postgres.js style: `await sql('customers').update(updates).where({ id })`? No, our `sql` is template literal.
  // Standard SQL:
  const updatedCustomer = await sql`
    UPDATE customers
    SET name = ${name}, mobile = ${mobile || null}, address = ${address || null}, notes = ${notes || null}
    WHERE id = ${id}
    RETURNING *
  `;

  res.json({ success: true, data: updatedCustomer[0] });
}));

// DELETE /api/customers/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  res.json({ success: true, message: 'Customer deleted' });
}));

export default router;

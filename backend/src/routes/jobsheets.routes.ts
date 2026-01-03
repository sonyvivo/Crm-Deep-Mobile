import { Router, Response } from 'express';
import sql from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/jobsheets
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobsheets = await sql`SELECT * FROM job_sheets ORDER BY created_at DESC`;
    res.json({ success: true, data: jobsheets });
}));

// GET /api/jobsheets/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const items = await sql`SELECT * FROM job_sheets WHERE id = ${id}`;

    if (items.length === 0) {
        return res.status(404).json({ success: false, error: 'Job sheet not found' });
    }
    res.json({ success: true, data: items[0] });
}));

// POST /api/jobsheets
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const j = req.body;

    const result = await sql`
    INSERT INTO job_sheets (
      id, date, status, customer_name, customer_mobile, customer_alt_mobile, customer_address,
      service_type, job_type, priority, device_brand, device_model, imei, color, lock_type, lock_code,
      fault_category, customer_remark, technician_note, scratches, dents, back_glass_broken, bent_frame,
      accessories_rec, estimated_cost, advance_payment, pending_amount, created_at, updated_at
    ) VALUES (
      ${j.id}, ${j.date}, ${j.status}, ${j.customerName}, ${j.customerMobile}, ${j.customerAltMobile || null},
      ${j.customerAddress || null}, ${j.serviceType || null}, ${j.jobType || null}, ${j.priority || null},
      ${j.deviceBrand}, ${j.deviceModel}, ${j.imei}, ${j.color || null}, ${j.lockType || null}, ${j.lockCode || null},
      ${JSON.stringify(j.faultCategory || [])}, ${j.customerRemark || null}, ${j.technicianNote || null},
      ${j.scratches || false}, ${j.dents || false}, ${j.backGlassBroken || false}, ${j.bentFrame || false},
      ${JSON.stringify(j.accessoriesRec || [])}, ${j.estimatedCost}, ${j.advancePayment}, ${j.pendingAmount},
      ${j.createdAt}, ${j.updatedAt}
    )
    RETURNING *
  `;

    res.status(201).json({ success: true, data: result[0] });
}));

// PUT /api/jobsheets/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const j = req.body;

    const result = await sql`
    UPDATE job_sheets SET
      date = ${j.date}, status = ${j.status}, customer_name = ${j.customerName}, customer_mobile = ${j.customerMobile},
      customer_alt_mobile = ${j.customerAltMobile || null}, customer_address = ${j.customerAddress || null},
      service_type = ${j.serviceType || null}, job_type = ${j.jobType || null}, priority = ${j.priority || null},
      device_brand = ${j.deviceBrand}, device_model = ${j.deviceModel}, imei = ${j.imei}, color = ${j.color || null},
      lock_type = ${j.lockType || null}, lock_code = ${j.lockCode || null}, fault_category = ${JSON.stringify(j.faultCategory || [])},
      customer_remark = ${j.customerRemark || null}, technician_note = ${j.technicianNote || null},
      scratches = ${j.scratches || false}, dents = ${j.dents || false}, back_glass_broken = ${j.backGlassBroken || false},
      bent_frame = ${j.bentFrame || false}, accessories_rec = ${JSON.stringify(j.accessoriesRec || [])},
      estimated_cost = ${j.estimatedCost}, advance_payment = ${j.advancePayment}, pending_amount = ${j.pendingAmount},
      updated_at = ${j.updatedAt || new Date().toISOString()}
    WHERE id = ${id}
    RETURNING *
  `;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Job sheet not found' });
    }
    res.json({ success: true, data: result[0] });
}));

// DELETE /api/jobsheets/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await sql`DELETE FROM job_sheets WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Job sheet not found' });
    }
    res.json({ success: true, message: 'Job sheet deleted' });
}));

export default router;

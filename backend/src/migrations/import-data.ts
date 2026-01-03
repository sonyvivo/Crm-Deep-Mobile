import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

interface JsonData {
    purchases: any[];
    sales: any[];
    expenses: any[];
    customers: any[];
    jobSheets: any[];
    invoices: any[];
    suppliers: any[];
}

async function importData() {
    try {
        console.log('Reading JSON file...');
        const jsonContent = readFileSync('/home/deep-gupta/Downloads/chek.json', 'utf-8');
        const data: JsonData = JSON.parse(jsonContent);

        console.log('Data counts:');
        console.log('  Purchases:', data.purchases?.length || 0);
        console.log('  Sales:', data.sales?.length || 0);
        console.log('  Expenses:', data.expenses?.length || 0);
        console.log('  Customers:', data.customers?.length || 0);
        console.log('  Job Sheets:', data.jobSheets?.length || 0);
        console.log('  Invoices:', data.invoices?.length || 0);
        console.log('  Suppliers:', data.suppliers?.length || 0);

        // Import Customers
        if (data.customers && data.customers.length > 0) {
            console.log('\nImporting customers...');
            for (const c of data.customers) {
                await sql`
          INSERT INTO customers (id, name, mobile, address, notes)
          VALUES (${c.id}, ${c.name || ''}, ${c.mobile || ''}, ${c.address || ''}, ${c.notes || ''})
          ON CONFLICT (id) DO NOTHING
        `;
            }
            console.log('✓ Customers imported!');
        }

        // Import Suppliers (suppliers table has SERIAL id, so we skip id)
        if (data.suppliers && data.suppliers.length > 0) {
            console.log('\nImporting suppliers...');
            for (const s of data.suppliers) {
                await sql`
          INSERT INTO suppliers (name)
          VALUES (${s.name || s})
          ON CONFLICT (name) DO NOTHING
        `;
            }
            console.log('✓ Suppliers imported!');
        }

        // Import Purchases
        if (data.purchases && data.purchases.length > 0) {
            console.log('\nImporting purchases...');
            for (const p of data.purchases) {
                await sql`
          INSERT INTO purchases (id, date, supplier, device_brand, device_model, part_name, unit_price, total_amount, notes)
          VALUES (${p.id}, ${p.date}, ${p.supplier || ''}, ${p.deviceBrand || ''}, ${p.deviceModel || ''}, ${p.partName || ''}, ${p.unitPrice || 0}, ${p.totalAmount || 0}, ${p.notes || ''})
          ON CONFLICT (id) DO NOTHING
        `;
            }
            console.log('✓ Purchases imported!');
        }

        // Import Sales
        if (data.sales && data.sales.length > 0) {
            console.log('\nImporting sales...');
            for (const s of data.sales) {
                await sql`
          INSERT INTO sales (id, date, customer, customer_mobile, device_brand, device_model, problem, part_name, unit_price, purchase_cost, profit, total_amount, payment_mode, pending_amount, notes)
          VALUES (${s.id}, ${s.date}, ${s.customer || ''}, ${s.customerMobile || ''}, ${s.deviceBrand || ''}, ${s.deviceModel || ''}, ${s.problem || ''}, ${s.partName || ''}, ${s.unitPrice || 0}, ${s.purchaseCost || s.purchasePrice || 0}, ${s.profit || 0}, ${s.totalAmount || 0}, ${s.paymentMode || 'Cash'}, ${s.pendingAmount || 0}, ${s.notes || ''})
          ON CONFLICT (id) DO NOTHING
        `;
            }
            console.log('✓ Sales imported!');
        }

        // Import Expenses
        if (data.expenses && data.expenses.length > 0) {
            console.log('\nImporting expenses...');
            for (const e of data.expenses) {
                await sql`
          INSERT INTO expenses (id, date, category, description, vendor, amount, payment_mode, notes)
          VALUES (${e.id}, ${e.date}, ${e.category || ''}, ${e.description || ''}, ${e.vendor || ''}, ${e.amount || 0}, ${e.paymentMode || 'Cash'}, ${e.notes || ''})
          ON CONFLICT (id) DO NOTHING
        `;
            }
            console.log('✓ Expenses imported!');
        }

        // Import Job Sheets
        if (data.jobSheets && data.jobSheets.length > 0) {
            console.log('\nImporting job sheets...');
            for (const j of data.jobSheets) {
                await sql`
          INSERT INTO job_sheets (id, date, status, customer_name, customer_mobile, device_brand, device_model, imei, fault_category, customer_remark, estimated_cost, advance_payment)
          VALUES (${j.id}, ${j.date}, ${j.status || 'Pending'}, ${j.customerName || ''}, ${j.mobile || ''}, ${j.deviceBrand || ''}, ${j.deviceModel || ''}, ${j.imei || ''}, ${JSON.stringify(j.faultCategories || [])}, ${j.problemDescription || ''}, ${j.estimatedCost || 0}, ${j.advancePayment || 0})
          ON CONFLICT (id) DO NOTHING
        `;
            }
            console.log('✓ Job Sheets imported!');
        }

        // Import Invoices
        if (data.invoices && data.invoices.length > 0) {
            console.log('\nImporting invoices...');
            for (const inv of data.invoices) {
                await sql`
          INSERT INTO invoices (id, date, customer_name, customer_mobile, customer_address, items, subtotal, discount, total_amount, notes)
          VALUES (${inv.id}, ${inv.date}, ${inv.customerName || ''}, ${inv.customerMobile || ''}, ${inv.customerAddress || ''}, ${JSON.stringify(inv.items || [])}, ${inv.subtotal || 0}, ${inv.discount || 0}, ${inv.total || 0}, ${inv.notes || ''})
          ON CONFLICT (id) DO NOTHING
        `;
            }
            console.log('✓ Invoices imported!');
        }

        console.log('\n✅ All data imported successfully!');
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importData();

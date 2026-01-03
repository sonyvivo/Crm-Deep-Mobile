import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...');

        // Create users table
        await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
        console.log('✅ Created users table');

        // Create customers table
        await sql`CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      mobile VARCHAR(20),
      address TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
        console.log('✅ Created customers table');

        // Create suppliers table
        await sql`CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
        console.log('✅ Created suppliers table');

        // Create purchases table
        await sql`CREATE TABLE IF NOT EXISTS purchases (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(50) NOT NULL,
      supplier VARCHAR(255),
      device_brand VARCHAR(100),
      device_model VARCHAR(100),
      part_name VARCHAR(255),
      part_name_other VARCHAR(255),
      unit_price DECIMAL(10, 2),
      total_amount DECIMAL(10, 2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
        console.log('✅ Created purchases table');

        // Create sales table
        await sql`CREATE TABLE IF NOT EXISTS sales (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(50) NOT NULL,
      customer VARCHAR(255),
      customer_mobile VARCHAR(20),
      device_brand VARCHAR(100),
      device_model VARCHAR(100),
      problem TEXT,
      part_name VARCHAR(255),
      part_name_other VARCHAR(255),
      unit_price DECIMAL(10, 2),
      purchase_cost DECIMAL(10, 2),
      profit DECIMAL(10, 2),
      total_amount DECIMAL(10, 2),
      notes TEXT,
      payment_mode VARCHAR(50),
      pending_amount DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
        console.log('✅ Created sales table');

        // Create expenses table
        await sql`CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(50) NOT NULL,
      category VARCHAR(100),
      description TEXT,
      vendor VARCHAR(255),
      amount DECIMAL(10, 2),
      payment_mode VARCHAR(50),
      receipt VARCHAR(50),
      receipt_number VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
        console.log('✅ Created expenses table');

        // Create job_sheets table
        await sql`CREATE TABLE IF NOT EXISTS job_sheets (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_mobile VARCHAR(20) NOT NULL,
      customer_alt_mobile VARCHAR(20),
      customer_address TEXT,
      service_type VARCHAR(50),
      job_type VARCHAR(50),
      priority VARCHAR(50),
      device_brand VARCHAR(100),
      device_model VARCHAR(100),
      imei VARCHAR(50),
      color VARCHAR(50),
      lock_type VARCHAR(50),
      lock_code VARCHAR(100),
      fault_category JSONB DEFAULT '[]',
      customer_remark TEXT,
      technician_note TEXT,
      scratches BOOLEAN DEFAULT false,
      dents BOOLEAN DEFAULT false,
      back_glass_broken BOOLEAN DEFAULT false,
      bent_frame BOOLEAN DEFAULT false,
      accessories_rec JSONB DEFAULT '[]',
      estimated_cost DECIMAL(10, 2) DEFAULT 0,
      advance_payment DECIMAL(10, 2) DEFAULT 0,
      pending_amount DECIMAL(10, 2) DEFAULT 0,
      created_at VARCHAR(50),
      updated_at VARCHAR(50)
    )`;
        console.log('✅ Created job_sheets table');

        // Create invoices table
        await sql`CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_mobile VARCHAR(20),
      customer_address TEXT,
      device_type VARCHAR(100),
      device_brand VARCHAR(100),
      device_model VARCHAR(100),
      device_imei VARCHAR(50),
      device_issues TEXT,
      device_accessories TEXT,
      items JSONB DEFAULT '[]',
      subtotal DECIMAL(10, 2) DEFAULT 0,
      tax_percent DECIMAL(5, 2) DEFAULT 0,
      discount DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) DEFAULT 0,
      payment_status VARCHAR(50),
      amount_paid DECIMAL(10, 2) DEFAULT 0,
      balance_due DECIMAL(10, 2) DEFAULT 0,
      warranty_info TEXT,
      technician_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
        console.log('✅ Created invoices table');

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_job_sheets_status ON job_sheets(status)`;
        console.log('✅ Created indexes');

        console.log('\n✅ All migrations completed successfully!');
        console.log('\n📌 Next step: Register your first admin user by calling:');
        console.log('   POST http://localhost:3000/api/auth/register');
        console.log('   with {"username": "your-username", "password": "your-password"}');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();

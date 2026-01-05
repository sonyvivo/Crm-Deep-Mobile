
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function addRecoveryColumn() {
    try {
        console.log('🔄 Checking for recovery_key_hash column...');

        // Check if column exists
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'recovery_key_hash'
        `;

        if (columns.length === 0) {
            console.log('➕ Adding recovery_key_hash column...');
            await sql`ALTER TABLE users ADD COLUMN recovery_key_hash VARCHAR(255)`;
            console.log('✅ Column added successfully');
        } else {
            console.log('ℹ️ Column already exists');
        }

        // Set default recovery key 'secret' for all users if not set
        console.log('🔑 Setting default recovery key "secret" for all users...');
        const recoveryHash = await bcrypt.hash('secret', 10);
        await sql`UPDATE users SET recovery_key_hash = ${recoveryHash} WHERE recovery_key_hash IS NULL`;
        console.log('✅ Default recovery key set');

    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        process.exit();
    }
}

addRecoveryColumn();

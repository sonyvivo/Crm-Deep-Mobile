
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function updateCredentials() {
    try {
        const username = '7405433726';
        const newPasswordRaw = 'Sudha@2211';
        const newRecoveryKeyRaw = '16-02-1999';

        console.log(`🔄 Updating credentials for user: ${username}...`);

        // Hash new credentials
        const passwordHash = await bcrypt.hash(newPasswordRaw, 10);
        const recoveryKeyHash = await bcrypt.hash(newRecoveryKeyRaw, 10);

        // Update database
        await sql`
            UPDATE users 
            SET password_hash = ${passwordHash}, 
                recovery_key_hash = ${recoveryKeyHash}
            WHERE username = ${username}
        `;

        console.log('✅ Password updated successfully.');
        console.log('✅ Recovery Key updated successfully.');

    } catch (error) {
        console.error('❌ Error updating credentials:', error);
    } finally {
        process.exit();
    }
}

updateCredentials();

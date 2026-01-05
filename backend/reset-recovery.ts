
import sql from './src/config/database';
import bcrypt from 'bcryptjs';

async function resetRecoveryKey(username: string) {
    try {
        console.log(`Resetting recovery key for: ${username}`);
        // Hash the secret 'secret'
        const newHash = await bcrypt.hash('secret', 10);
        await sql`UPDATE users SET recovery_key_hash = ${newHash} WHERE username = ${username}`;
        console.log('Recovery key reset to "secret"');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

resetRecoveryKey('kuldeepgupta577');

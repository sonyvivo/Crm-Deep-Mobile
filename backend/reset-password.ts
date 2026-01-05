
import sql from './src/config/database';
import bcrypt from 'bcryptjs';

async function resetPassword(username: string) {
    try {
        console.log(`Resetting password for: ${username}`);
        const newHash = await bcrypt.hash('123456', 10);
        await sql`UPDATE users SET password_hash = ${newHash} WHERE username = ${username}`;
        console.log('Password reset to "123456"');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

resetPassword('kuldeepgupta577');

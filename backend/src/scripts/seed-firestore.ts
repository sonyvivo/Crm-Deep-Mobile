
import { db } from '../config/firebase.js';
import bcrypt from 'bcryptjs';

async function seedUser() {
    try {
        const username = '7405433726';

        console.log('🌱 Checking for existing users...');
        const snapshot = await db.collection('users').get();
        if (!snapshot.empty) {
            console.log('✅ Users already exist in Firestore.');
            return;
        }

        console.log('🆕 Creating initial admin user...');

        const passwordHash = await bcrypt.hash('Sudha@2211', 10);
        const pinHash = await bcrypt.hash('1234', 10);
        const recoveryKeyHash = await bcrypt.hash('16-02-1999', 10);

        const newUser = {
            username: username,
            password_hash: passwordHash,
            pin: pinHash,
            recovery_key_hash: recoveryKeyHash,
            created_at: new Date().toISOString()
        };

        const docRef = await db.collection('users').add(newUser);
        console.log(`✅ User created with ID: ${docRef.id}`);

    } catch (error) {
        console.error('❌ Error seeding user:', error);
    } finally {
        process.exit(); // Force exit since firebase admin keeps connection open
    }
}

seedUser();

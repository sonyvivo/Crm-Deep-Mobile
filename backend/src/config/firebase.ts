
import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
    });
    console.log('🔥 Firebase Admin Initialized');
} catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
}

const db = admin.firestore();

export { admin, db };

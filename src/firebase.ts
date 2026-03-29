import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Import the Firebase configuration
// NOTE: This file is a placeholder to allow the app to build in mock mode.
// To use real Firebase, run the Firebase setup tool in AI Studio.
const firebaseConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "placeholder-auth-domain",
  projectId: "placeholder-project-id",
  storageBucket: "placeholder-storage-bucket",
  messagingSenderId: "placeholder-messaging-sender-id",
  appId: "placeholder-app-id",
  firestoreDatabaseId: "(default)"
};

import { CONFIG } from './config';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Test connection to Firestore
async function testConnection() {
  // Skip connection test if we are using mock data
  if (CONFIG.USE_MOCK) return;

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

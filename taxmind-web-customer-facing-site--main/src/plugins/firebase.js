import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration - these values should come from your Firebase project
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID,
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app = null;
let messaging = null;

try {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] Firebase app initialized successfully');
  messaging = getMessaging(app);
  console.log('[Firebase] Firebase messaging initialized successfully');
} catch (error) {
  console.error('[Firebase] Firebase initialization error:', error);
  console.error('[Firebase] Error details:', error.message);
}

export { app, messaging, getToken, onMessage };

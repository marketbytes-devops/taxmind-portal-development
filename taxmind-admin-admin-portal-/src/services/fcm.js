import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

const BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID
};

class FCMService {
  constructor() {
    this.app = null;
    this.messaging = null;
    this.vapidKey = process.env.VUE_APP_FCM_VAPID_KEY;
  }

  /**
   * Initialize Firebase and request notification permission
   */
  async initialize() {
    try {
      console.log('[FCM Service] Initializing FCM Service...');
      
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(this.app);

      console.log('[FCM Service] Firebase app initialized successfully');

      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log('[FCM Service] Notification permission:', permission);

      if (permission === 'granted') {
        console.log('[FCM Service] Notification permission granted');
        const token = await this.getFCMToken();
        console.log('[FCM Service] Token obtained:', token ? 'yes' : 'no');
        
        // If user is already logged in, register token with backend
        if (token) {
          await this.registerTokenWithBackend(token);
        }
      } else {
        console.warn('[FCM Service] Notification permission denied');
      }
    } catch (error) {
      console.error('[FCM Service] Error initializing FCM service:', error);
    }
  }

  /**
   * Get FCM token and store in localStorage
   */
  async getFCMToken() {
    try {
      console.log('[FCM Service] Getting FCM token...');
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('[FCM Service] Service worker is ready:', registration);

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('[FCM Service] FCM Token generated:', token.substring(0, 20) + '...');
        localStorage.setItem('fcmToken', token);
        console.log('[FCM Service] Token saved to localStorage');
        return token;
      } else {
        console.warn('[FCM Service] No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('[FCM Service] Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend (if user is logged in)
   */
  async registerTokenWithBackend(fcmToken) {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        console.log('User not logged in, skipping FCM token registration with backend');
        return;
      }

      console.log('Registering FCM token with backend...');
      await axios.patch(`${BASE_URL}/notifications/admin/fcm-token`, 
        { fcmToken },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      console.log('FCM token registered successfully with backend');
    } catch (error) {
      console.error('Error registering FCM token with backend:', error);
    }
  }

  /**
   * Listen for foreground messages
   */
  onMessage(callback) {
    if (!this.messaging) {
      console.error('Messaging not initialized');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  }

  /**
   * Get stored FCM token from localStorage
   */
  getStoredToken() {
    return localStorage.getItem('fcmToken');
  }

  /**
   * Remove FCM token from localStorage
   */
  removeToken() {
    console.log('Removing FCM token from localStorage');
    localStorage.removeItem('fcmToken');
  }
}

// Export singleton instance
export default new FCMService();

import { messaging, getToken, onMessage } from '@/plugins/firebase';
import axios from 'axios';

class FCMService {
  constructor() {
    this.currentToken = null;
    this.vapidKey = process.env.VUE_APP_FIREBASE_VAPID_KEY;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        return true;
      } else {
        console.log('Notification permission denied.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token for the device
   */
  async getDeviceToken() {
    try {
      if (!messaging) {
        console.error('Firebase messaging is not initialized');
        return null;
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check if notification permission is granted
      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          console.log('Permission not granted for notifications');
          return null;
        }
      }

      // Get registration token
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        console.log('FCM Token generated:', token);
        this.currentToken = token;
        localStorage.setItem('fcmToken', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
      return null;
    }
  }

  /**
   * Send FCM token to backend server
   */
  async sendTokenToServer(token) {
    try {
      const accessToken = localStorage.getItem('accesstoken') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.log('No access token found. Cannot send FCM token to server.');
        return false;
      }

      const response = await axios({
        method: 'PATCH',
        url: '/notifications/user/fcm-token',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          fcmToken: token
        }
      });

      if (response.data.status) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize FCM and get device token
   */
  async initialize() {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        return null;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        return null;
      }

      
      // Register service worker
   
      await this.registerServiceWorker();

      // Get device token

      const token = await this.getDeviceToken();

      if (token) {

        // Send token to server
        await this.sendTokenToServer(token);
      } else {
        console.log(' No token received, skipping server sync');
      }

      // Setup foreground message listener
      this.setupForegroundMessageListener();

  
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register service worker for FCM
   */
  async registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    return registration;
  }

  /**
   * Setup listener for foreground messages
   */
  setupForegroundMessageListener() {
    if (!messaging) {
      return;
    }


    onMessage(messaging, (payload) => {

      // Extract notification data
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationBody = payload.notification?.body || 'You have a new message';
      const notificationIcon = payload.notification?.icon || '/favicon.ico';
      const notificationData = payload.data || {};

      // Display notification
      const notificationOptions = {
        body: notificationBody,
        icon: notificationIcon,
        badge: '/favicon.ico',
        data: notificationData,
        requireInteraction: false,
        tag: notificationData?.id || Date.now().toString(),
        // Add vibration pattern for mobile
        vibrate: [200, 100, 200],
        // Add action buttons if needed
        actions: payload.notification?.actions || []
      };

      if (Notification.permission === 'granted') {
        const notification = new Notification(notificationTitle, notificationOptions);
        
        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          
          // Close notification
          notification.close();
          
          // Handle navigation or custom action based on notification data
          if (notificationData.url) {
            window.open(notificationData.url, '_blank');
          } else if (notificationData.action) {
            // Emit custom event for app to handle
            window.dispatchEvent(new CustomEvent('fcm-notification-click', {
              detail: notificationData
            }));
          }
        };

        // Auto-close notification after 5 seconds if not interacted with
        setTimeout(() => {
          notification.close();
        }, 5000);
      } else {
        console.log('[FCM] Notification permission not granted, cannot display notification');
      }

      // Emit custom event for the app to handle (e.g., update UI, refresh data)
      window.dispatchEvent(new CustomEvent('fcm-message-received', {
        detail: {
          title: notificationTitle,
          body: notificationBody,
          data: notificationData,
          timestamp: Date.now()
        }
      }));
    });
  }

  /**
   * Get current FCM token
   */
  getCurrentToken() {
    return this.currentToken || localStorage.getItem('fcmToken');
  }

  /**
   * Delete FCM token
   */
  async deleteToken() {
    try {
      this.currentToken = null;
      localStorage.removeItem('fcmToken');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new FCMService();

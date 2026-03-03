// Firebase Messaging Service Worker Template
// This file is used to generate the actual firebase-messaging-sw.js during build/deployment.

importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Customize background notification handler
messaging.setBackgroundMessageHandler(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png',
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

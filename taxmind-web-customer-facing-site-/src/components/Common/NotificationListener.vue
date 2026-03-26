<template>
  <div class="notification-container">
    <transition-group name="notification-list" tag="div">
      <v-card
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-card"
        elevation="4"
        color="white"
      >
        <v-card-text class="notification-content">
          <div style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div style="display: flex; flex-direction: column;">
              <span style="color: #1A73E9; font-size: 16px;text-align: start;">{{ notification.title }}</span>
              <span style="color: #666; font-size: 14px; margin-top: 4px;">{{ notification.body }}</span>
            </div>
            <v-btn
              color="grey"
              icon
              small
              aria-label="Close notification"
              @click="removeNotification(notification.id)"
              style="margin-left: 8px;"
            >
              <v-icon color="grey" size="20">mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'NotificationListener',
  
  data() {
    return {
      notifications: [],
      notificationIdCounter: 0
    };
  },
  
  mounted() {
    this.setupNotificationListeners();
  },
  
  beforeDestroy() {
    this.removeNotificationListeners();
  },
  
  methods: {
    setupNotificationListeners() {
      console.log('[NotificationListener] Setting up notification listeners...');
      
      window.addEventListener('fcm-message-received', this.handleFCMMessage);
      
      window.addEventListener('fcm-notification-click', this.handleNotificationClick);
    },
    
    removeNotificationListeners() {
      window.removeEventListener('fcm-message-received', this.handleFCMMessage);
      window.removeEventListener('fcm-notification-click', this.handleNotificationClick);
    },
    
    handleFCMMessage(event) {
      console.log('[NotificationListener] FCM message received:', event.detail);
      
      const { title, body, data } = event.detail;
      
      const notification = {
        id: this.notificationIdCounter++,
        title: title || 'New Notification',
        body: body || '',
        show: true,
        data: data
      };
      
      this.notifications.unshift(notification);
      
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, 5000);
      
      if (data && data.type === 'application_update') {
        this.refreshApplicationData();
      } else if (data && data.type === 'message') {
        this.refreshMessages();
      }
    },
    
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    },
    
    handleNotificationClick(event) {
      console.log('[NotificationListener] Notification clicked:', event.detail);
      
      const data = event.detail;
      
      if (data.action === 'view_application') {
        this.$router.push(`/application/${data.applicationId}`);
      } else if (data.action === 'view_profile') {
        this.$router.push('/profile');
      }
    },
    
    refreshApplicationData() {
      console.log('[NotificationListener] Refreshing application data...');
    },
    
    refreshMessages() {
      console.log('[NotificationListener] Refreshing messages...');
    }
  }
};
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  width: 400px;
}

.notification-card {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-content {
  padding: 12px 16px !important;
}

.notification-list-enter-active {
  animation: slideIn 0.3s ease-out;
}

.notification-list-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@media (max-width: 600px) {
  .notification-container {
    width: calc(100% - 40px);
    max-width: calc(100% - 40px);
    right: 20px;
  }
}
</style>

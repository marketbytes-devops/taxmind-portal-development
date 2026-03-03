<template>
  <v-snackbar
    v-model="showToast"
    :timeout="5000"
    bottom
    right
    color="white"
    elevation="24"
    class="notification-toast"
  >
    <div class="d-flex align-center">
      <v-icon left color="#1A73E9">mdi-bell</v-icon>
      <div class="flex-grow-1">
        <div class="toast-title">{{ currentNotification.title }}</div>
        <div class="toast-body">{{ currentNotification.body }}</div>
      </div>
    </div>
    <template v-slot:action="{ attrs }">
      <v-btn
        icon
        v-bind="attrs"
        @click="showToast = false"
      >
        <v-icon color="#757575">mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'NotificationToast',
  
  data() {
    return {
      showToast: false,
      currentNotification: {
        title: '',
        body: ''
      },
      displayedNotificationIds: new Set()
    };
  },
  
  computed: {
    ...mapGetters('notifications', ['unreadNotifications'])
  },
  
  watch: {
    unreadNotifications: {
      handler(newNotifications) {
        if (newNotifications && newNotifications.length > 0) {
          // Get the latest notification that hasn't been displayed yet
          const latestNotification = newNotifications.find(
            n => !this.displayedNotificationIds.has(n.id || n._id)
          );
          
          if (latestNotification) {
            this.displayNotification(latestNotification);
          }
        }
      },
      deep: true
    }
  },
  
  methods: {
    displayNotification(notification) {
      // Mark as displayed using id or _id
      const notifId = notification.id || notification._id;
      this.displayedNotificationIds.add(notifId);
      
      // Set current notification
      this.currentNotification = {
        title: notification.title || 'New Notification',
        body: notification.body || notification.message || ''
      };
      
      // Show toast
      this.showToast = true;
      
      // Clean up old displayed IDs (keep only last 100)
      if (this.displayedNotificationIds.size > 100) {
        const idsArray = Array.from(this.displayedNotificationIds);
        this.displayedNotificationIds = new Set(idsArray.slice(-100));
      }
    }
  }
};
</script>

<style scoped>
.notification-toast {
  border-radius: 12px;
  min-width: 340px;
  max-width: 420px;
  padding: 0;
}
.toast-title {
  font-weight: 600;
  font-size: 16px;
  color: #1A73E9;
  margin-bottom: 2px;
}
.toast-body {
  font-size: 14px;
  color: #757575;
  opacity: 1;
}
</style>

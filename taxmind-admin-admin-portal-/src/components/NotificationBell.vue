<template>
  <div class="notification-bell">
    <!-- Bell Icon with Badge -->
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      offset-y
      left
      min-width="420"
      max-width="600"
      max-height="600"
      @input="handleMenuChange"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          icon
          v-bind="attrs"
          v-on="on"
          @click="handleBellClick"
        >
          <v-badge
            :content="unreadCount > 99 ? '99+' : unreadCount"
            :value="unreadCount > 0"
            color="error"
            overlap
          >
            <v-icon color="#1A73E9">mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <!-- Notification Dropdown -->
      <v-card>
        <v-card-title class="pa-3">
          <span class="text-h6">Notifications</span>
          <v-spacer></v-spacer>
          <span v-if="unreadCount > 0" class="text-caption grey--text">
            {{ unreadCount }} unread
          </span>
        </v-card-title>

        <v-divider></v-divider>

        <!-- Loading State -->
        <div v-if="isLoading" class="pa-4 text-center">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>

        <!-- Notifications List -->
        <v-list v-else-if="allNotifications.length > 0" class="notification-list">
          <v-list-item
            v-for="notification in allNotifications"
            :key="notification.id || notification._id"
            :class="{ 'unread-notification': notification.isNotificationSeen === false }"
            class="notification-item"
          >
            <v-list-item-avatar size="36">
              <v-icon :color="notification.isNotificationSeen === false ? 'primary' : 'grey'">
                mdi-bell-circle
              </v-icon>
            </v-list-item-avatar>
            
            <v-list-item-content>
              <v-list-item-title class="notification-title" style="white-space:normal;word-break:break-word;">
                {{ notification.title }}
              </v-list-item-title>
              <v-list-item-subtitle class="notification-body" style="white-space:normal;word-break:break-word;">
                {{ notification.body || notification.message }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="notification-time">
                {{ formatTime(notification.createdAt || notification.timestamp) }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <!-- Empty State -->
        <div v-else class="pa-4 text-center grey--text">
          <v-icon large color="grey lighten-1">mdi-bell-off</v-icon>
          <p class="mt-2">No notifications</p>
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'NotificationBell',
  
  data() {
    return {
      menu: false
    };
  },
  
  computed: {
    ...mapGetters('notifications', [
      'allNotifications',
      'unreadCount',
      'isLoading'
    ])
  },
  
  methods: {
    ...mapActions('notifications', [
      'fetchNotifications',
      'markAllNotificationsAsSeen'
    ]),
    
    async handleBellClick() {
      // Fetch latest notifications when bell is clicked
      try {
        await this.fetchNotifications({ page: 1, size: 20 });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    },
    
    async handleMenuChange(isOpen) {
      console.log('[NotificationBell] Menu state changed:', isOpen ? 'opened' : 'closed');
      
      // Mark all as seen when dropdown closes
      if (!isOpen) {
        console.log('[NotificationBell] Popup closed, triggering mark all as seen API...');
        try {
          await this.markAllNotificationsAsSeen();
          console.log('[NotificationBell] Mark all as seen completed');
        } catch (error) {
          console.error('[NotificationBell] Error marking notifications as seen:', error);
        }
      }
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      // Handle both ISO string and timestamp formats
      const date = new Date(timestamp);
      const now = Date.now();
      const diff = now - date.getTime();
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (seconds < 60) {
        return 'Just now';
      } else if (minutes < 60) {
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else if (days < 7) {
        return `${days}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  }
};
</script>

<style scoped>
.notification-bell {
  display: inline-block;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.unread-notification {
  background-color: #e3f2fd; /* Light blue - primary color tint */
  border-left: 3px solid #1A73E9; /* Primary blue accent */
}

.unread-notification:hover {
  background-color: #bbdefb;
}

.notification-item:not(.unread-notification) {
  background-color: #ffffff; /* White background for read notifications */
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #212121;
  margin-bottom: 4px;
}

.notification-body {
  font-size: 13px;
  color: #616161;
  margin-bottom: 4px;
  line-height: 1.3;
}

.notification-time {
  font-size: 11px;
  color: #9e9e9e;
}
</style>

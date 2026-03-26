import http from '@/api/http';

const state = {
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  isLoading: false,
  error: null
};

const mutations = {
  setNotifications(state, { notifications, totalCount, unreadCount }) {
    state.notifications = notifications;
    state.totalCount = totalCount || notifications.length;
    state.unreadCount = unreadCount || notifications.filter(n => n.isNotificationSeen === false).length;
  },
  
  addNotification(state, notification) {
    // Add notification to beginning of array
    state.notifications.unshift(notification);
    if (notification.isNotificationSeen === false) {
      state.unreadCount++;
    }
    state.totalCount++;
  },
  
  markAllAsSeen(state) {
    state.notifications.forEach(n => {
      n.isNotificationSeen = true;
    });
    state.unreadCount = 0;
  },
  
  setLoading(state, isLoading) {
    state.isLoading = isLoading;
  },
  
  setError(state, error) {
    state.error = error;
  },
  
  setCurrentPage(state, page) {
    state.currentPage = page;
  }
};

const actions = {
  // Register FCM token with backend (called on login)
  async registerFCMToken(_, fcmToken) {
    try {
      const token = localStorage.getItem('token');
      console.log('[FCM] registerFCMToken called');
      console.log('[FCM] Auth token exists:', !!token);
      console.log('[FCM] FCM token received:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
      
      if (!token || !fcmToken) {
        console.log('[FCM] Missing auth token or FCM token for registration');
        return;
      }
      
      console.log('[FCM] Calling PATCH API to register FCM token...');
      const response = await http.patch('/notifications/admin/fcm-token', { fcmToken });
      console.log('[FCM] Token registered successfully:', response.status);
    } catch (error) {
      console.error('[FCM] Error registering FCM token:', error.response?.data || error.message);
    }
  },
  
  // Fetch notifications (paginated)
  async fetchNotifications({ commit }, { page = 1, size = 20 } = {}) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const response = await http.get('/notifications/admin', {
        params: { page, size }
      });
      
      if (response.data) {
        const notifications = response.data.data || response.data.notifications || response.data || [];
        const totalCount = response.data.totalCount || response.data.total || notifications.length;
        // Count notifications where isNotificationSeen is false (unread)
        const unreadCount = response.data.unreadCount || response.data.unseenCount || notifications.filter(n => n.isNotificationSeen === false).length;
        
        commit('setNotifications', { notifications, totalCount, unreadCount });
        commit('setCurrentPage', page);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      commit('setError', error.message || 'Failed to fetch notifications');
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },
  
  // Mark all notifications as seen (called when closing dropdown)
  async markAllNotificationsAsSeen({ commit }) {
    console.log('[FCM] markAllNotificationsAsSeen called');
    
    try {
      const token = localStorage.getItem('token');
      console.log('[FCM] Auth token exists:', !!token);
      
      if (!token) {
        console.log('[FCM] No auth token, skipping mark as seen');
        return;
      }
      
      console.log('[FCM] Calling POST /notifications/admin/seen API...');
      const response = await http.post('/notifications/admin/seen');
      
      console.log('[FCM] Mark as seen API response status:', response.status);
      commit('markAllAsSeen');
      console.log('[FCM] All notifications marked as seen successfully');
    } catch (error) {
      console.error('[FCM] Error marking notifications as seen:', error);
      throw error;
    }
  },
  
  // Remove FCM token from backend (called on logout)
  async removeFCMToken(_, fcmToken) {
    try {
      const token = localStorage.getItem('token');
      console.log('[FCM] removeFCMToken called');
      console.log('[FCM] Auth token exists:', !!token);
      console.log('[FCM] FCM token to remove:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
      
      if (!token || !fcmToken) {
        console.log('[FCM] Missing auth token or FCM token for removal');
        return;
      }
      
      console.log('[FCM] Calling DELETE API to remove FCM token...');
      const response = await http.delete('/notifications/admin/fcm-token', {
        data: { fcmToken }
      });
      console.log('[FCM] Token removed successfully:', response.status);
    } catch (error) {
      console.error('[FCM] Error removing FCM token:', error.response?.data || error.message);
    }
  },
  
  // Add notification locally (used for real-time notifications)
  addLocalNotification({ commit, dispatch }, notification) {
    commit('addNotification', notification);
    // Also fetch latest notifications from server
    dispatch('fetchNotifications', { page: 1, size: 20 });
  }
};

const getters = {
  allNotifications: state => state.notifications,
  unreadNotifications: state => state.notifications.filter(n => n.isNotificationSeen === false),
  unreadCount: state => state.unreadCount,
  totalCount: state => state.totalCount,
  isLoading: state => state.isLoading,
  error: state => state.error,
  currentPage: state => state.currentPage
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};

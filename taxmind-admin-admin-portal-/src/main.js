import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./router";
import axios from "axios";
import store from "./store";
import "./plugins/base";
import ImageLoader from "./components/Common/imageLoader";
import "vuetify/dist/vuetify.min.css";
// Socket.IO is now imported directly in socket.js
import "@fontsource/dm-sans";
import "@/assets/styles/variables.css";
import "@/assets/styles/typography.css";
import VueStepProgress from "vue-step-progress";
import "vue-step-progress/dist/main.css";
import fcmService from "./services/fcm";

// Using direct Socket.IO implementation from socket.js instead of Vue plugin
Vue.use(VueStepProgress);
// Socket connection is now managed in socket.js

Vue.component("ImageLoader", ImageLoader);

import VueElementLoading from "vue-element-loading";
Vue.component("VueElementLoading", VueElementLoading);
import OwlCarousel from "vue-owl-carousel";
Vue.component("OwlCarousel", OwlCarousel);

// import VueApexCharts from "vue-apexcharts";
// Vue.use(VueApexCharts);

Vue.component("ImageLoader", ImageLoader);

// import Viewer from 'v-viewer'
// Vue.use(Viewer)
// import 'viewerjs/dist/viewer.css'
import ServerError from "./components/Common/500";
Vue.component("ServerError", ServerError);
window.axios = require("axios");

axios.defaults.baseURL = "https://api.taxmind.ie";
Vue.prototype.ipURL = "https://api.taxmind.ie";
Vue.prototype.mediaURL = "https://api.taxmind.ie/wp?key=";
Vue.prototype.mediaUURL = "https://api.taxmind.ie/wp?key=";
Vue.prototype.fileURL = "https://api.taxmind.ie/file/get?key=";

axios.defaults.baseURL = "https://api.taxmind.ie";
Vue.prototype.ipURL = "https://api.taxmind.ie";
Vue.prototype.mediaURL = "https://api.taxmind.ie/wp?key=";
Vue.prototype.mediaUURL = "https://api.taxmind.ie/wp?key=";
Vue.prototype.fileURL = "https://api.taxmind.ie/file/get?key=";

// axios.defaults.baseURL = "http://192.168.54.11:5065";
// Vue.prototype.ipURL =    "http://192.168.54.11:5065"
// Vue.prototype.mediaURL = "http://192.168.54.11:5065/wp?key=";
// Vue.prototype.mediaUURL ="http://192.168.54.11:5065/wp?key="
// Vue.prototype.fileURL =  "http://192.168.54.11:5065/file/get?key="

// axios.defaults.baseURL = "http://localhost:5065";
// Vue.prototype.ipURL = "http://localhost:5065"
// Vue.prototype.mediaURL = "http://localhost:5065/wp?key=";
// Vue.prototype.mediaUURL = "http://localhost:5065/wp?key="
// Vue.prototype.fileURL = "http://localhost:5065/file/get?key="

axios.defaults.timeout = 60000;

Vue.config.productionTip = false;

new Vue({
  vuetify,
  store,
  router,

  render: (h) => h(App),
  
  async mounted() {
    // Initialize FCM service
    console.log('Vue app mounted, initializing FCM...');
    await fcmService.initialize();
    
    // Register FCM token with backend if user is logged in
    const fcmToken = localStorage.getItem('fcmToken');
    const authToken = localStorage.getItem('token');
    if (fcmToken && authToken) {
      console.log('User logged in, registering FCM token with backend...');
      await this.$store.dispatch('notifications/registerFCMToken', fcmToken);
      
      // Fetch notifications on app mount
      try {
        await this.$store.dispatch('notifications/fetchNotifications', { page: 1, size: 20 });
      } catch (error) {
        console.error('Error fetching notifications on mount:', error);
      }
    }
    
    // Listen for foreground messages
    fcmService.onMessage((payload) => {
      console.log('Foreground message received in main.js:', payload);
      
      const notification = {
        id: payload.data?.id || Date.now(),
        title: payload.notification?.title || payload.data?.title || 'New Notification',
        body: payload.notification?.body || payload.data?.body || '',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isNotificationSeen: false,
        data: payload.data || {}
      };
      
      // Add notification to store (this will also fetch latest from server)
      this.$store.dispatch('notifications/addLocalNotification', notification);
    });
    
    // Listen for background messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Background message received from service worker:', event.data);
        
        if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
          const notification = {
            id: event.data.payload.data?.id || Date.now(),
            title: event.data.payload.title,
            body: event.data.payload.body,
            timestamp: event.data.payload.timestamp,
            createdAt: new Date().toISOString(),
            isNotificationSeen: false,
            data: event.data.payload.data || {}
          };
          
          // Add notification to store (this will also fetch latest from server)
          this.$store.dispatch('notifications/addLocalNotification', notification);
        }
      });
    }
  }
}).$mount("#app");

<template>
  <div>
    <v-app-bar app clipped-left clipped-right color="white" dark>
      <v-toolbar-title class="align-center d-flex">
        <v-layout wrap align-center justify-start>
          <v-flex xs2 sm2 md2 lg3>
            <v-btn class="mt-1 ml-5" :style="circleButtonStyle" @click="toggleSidebar" icon>
              <v-icon style="color: white">mdi-menu</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs10 sm9>
            <router-link to="/">
              <v-img src="../../assets/taxmindlogo.png" width="120px" contain height="120px" class="ml-10" />
            </router-link>
          </v-flex>
          <v-flex xs10> </v-flex>
        </v-layout>
      </v-toolbar-title>
      <v-spacer />
      <v-layout wrap justify-end class="hidden-xs-only">
        <v-flex class="d-flex align-center justify-end">
          <!-- Notification Bell -->
          <NotificationBell />
          
          <v-avatar size="30" color="#1A73E9" class="ml-3">
            <v-icon size="20px" color="white">mdi-account</v-icon>
          </v-avatar>
          <div class="d-flex flex-column ml-2">
            <span style="
                color: black;
                font-family: opensanssemibold;
                font-size: 15px;

              ">{{ userName.name || "Admin" }}</span>
            <!-- {{ userName.name }} -->
          </div>
          <v-divider vertical class="my-divider ml-6 mt-1"></v-divider>
          <v-btn @click="appLogout" text>
            <v-icon color="#1A73E9">mdi-logout</v-icon>
            <span style="
                color: black;
                margin-left: 8px;
                font-family: opensanssemibold;
                font-size: 15px;
              ">Logout</span>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-app-bar>
    
    <!-- Notification Toast -->
    <NotificationToast />
  </div>
</template>
<script>
import { mapState, mapMutations } from "vuex";
import NotificationBell from "@/components/NotificationBell.vue";
import NotificationToast from "@/components/NotificationToast.vue";

export default {
  name: "Header",

  components: {
    NotificationBell,
    NotificationToast
  },

  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    userRole: localStorage.getItem("role"),
    userName: JSON.parse(localStorage.getItem("admin_data")),
    circleButtonStyle: {
      backgroundColor: "#1A73E9",
      borderRadius: "50%",
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  }),

  computed: {
    ...mapState(["Sidebar_drawer"]),
    formattedUserRole() {
      if (this.userRole === "admin") {
        return "Admin";
      } else if (this.userRole === "subadmin") {
        return "Sub Admin";
      } else {
        return ""; // Default case if userRole doesn't match any known role
      }
    },
  },
  beforeMount() {
    // this.getProfile();
  },
  methods: {
    toggleSidebar() {
      this.setSidebarDrawer(!this.Sidebar_drawer);
    },
    ...mapMutations({
      setSidebarDrawer: "SET_SIDEBAR_DRAWER",
    }),
    // getProfile() {
    //   // this.appLoading = true;
    //   axios({
    //     method: "GET",
    //     url: "/user/me",
    //     headers: {
    //       token: localStorage.getItem("token"),
    //     },
    //   })
    //     .then((response) => {
    //       //this.appLoading = false;
    //       if (response.data.status) {
    //         this.userData = response.data.data;
    //       }
    //     })
    //     .catch((err) => {
    //       this.ServerError = true;
    //       console.log(err);
    //     });
    // },
    async appLogout() {
      console.log('[LOGOUT] Logout button clicked');
      
      // Get tokens from localStorage
      const fcmToken = localStorage.getItem('fcmToken');
      const accessToken = localStorage.getItem('token');
      
      console.log('[LOGOUT] FCM token in localStorage:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
      console.log('[LOGOUT] Access token in localStorage:', accessToken ? 'yes' : 'no');
      
      // Remove FCM token from backend using Vuex action
      if (fcmToken) {
        try {
          console.log('[LOGOUT] Dispatching removeFCMToken action...');
          await this.$store.dispatch('notifications/removeFCMToken', fcmToken);
          console.log('[LOGOUT] FCM token removal completed');
        } catch (error) {
          console.error('[LOGOUT] Error removing FCM token:', error);
        }
      } else {
        console.log('[LOGOUT] No FCM token found, skipping removal');
      }
      
      // Remove FCM token from localStorage
      localStorage.removeItem('fcmToken');
      
      // Import and call FCM service
      const fcmService = (await import('@/services/fcm')).default;
      fcmService.removeToken();
      
      // Unified logout: dispatch Vuex action which calls API and clears auth
      this.$store.dispatch('signOut').then(() => {
        this.$router.push('/Login');
      });
    },
  },
};
</script>

<style>
.logo-icon {
  display: flex;
  align-items: center;
}

.my-divider {
  height: 35px;
  /* Adjust the height as needed */
  width: 1px;
  margin-top: 1px;
  background-color: #c3c3c3;
  /* Adjust the color as needed */
}

.router-link {
  text-decoration: none;
}

.text-color {
  background-image: linear-gradient(to right, #fa709a 0%, #fee140 100%);
}

.size {
  z-index: 1;
  position: absolute;
  border: 2px solid black;
  left: 0;
  top: 0;
}
</style>

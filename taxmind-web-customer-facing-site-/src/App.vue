<template>
  <v-app>
    <AppHeader />
    <router-view
      style="background-color: #f6f9f7"
      :key="$route.fullPath"
      v-bind:storage="sideNav"
    />
    <AppFooter />

    <div class="whatsapp-button">
      <v-layout wrap justify-end pb-5>
        <v-flex xs12>
          <v-card rounded="xl">
            <v-layout wrap pa-2>
              <v-flex xs12>
                <span class="wtsphead">Chat with us !</span>
              </v-flex>
            </v-layout>
          </v-card>
        </v-flex>
      </v-layout>
      <v-layout wrap justify-end>
        <v-flex xs12>
          <a
            href="https://wa.me/+353871986494"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
          >
            <img src="../src/assets/images/whatsApp_icon.png" alt="WhatsApp" />
          </a>
        </v-flex>
        <v-flex xs12>
          <router-link to="/contact-us">
            <img src="../src/assets/images/gmailicon.webp" alt="Gmail" />
          </router-link>
        </v-flex>
      </v-layout>
    </div>
    <CookieConsent
      @cookies-accepted="handleCookiesAccepted"
      @cookies-rejected="handleCookiesRejected"
    />
    <GlobalSnackbar />
    <NotificationListener />
  </v-app>
</template>

<script>
import axios from "axios";
import AppHeader from "./components/Common/AppHeader";
import AppFooter from "./components/Common/AppFooter";
import CookieConsent from "./components/Common/CookieConsent";
import GlobalSnackbar from "./components/Common/GlobalSnackbar";
import NotificationListener from "./components/Common/NotificationListener";
import "./assets/styles/fonts.css";
import "./assets/styles/appStyle.css";
import Socket from "./Sockets/socket";
import FCMService from "./services/fcm";

export default {
  name: "App",

  components: {
    AppHeader,
    AppFooter,
    CookieConsent,
    GlobalSnackbar,
    NotificationListener,
  },
  computed: {
    authValue() {
      return this.$store.state.authentication;
    },
  },

  data: () => ({
    sideNav: true,
  }),
  beforeMount() {
    // Only fetch user if an access token exists (support legacy 'token' key too)
    const token =
      localStorage.getItem("accesstoken") || localStorage.getItem("token");
    if (token) {
      this.getUser();
    }
  },
  created() {
    this.$on("fetchUser", this.getUser);
  },
  mounted() {
    this.socketAuth();
    this.initializeFCM();
    
  },
  watch: {
    authValue() {
      if (this.authValue == false) this.socketAuth();
    },
  },
  methods: {
    handleCookiesAccepted() {
      // Implement any functionality needed when cookies are accepted
      // Initialize FCM after cookies are accepted
      this.initializeFCM();
    },
    handleCookiesRejected() {
      // Implement any functionality needed when cookies are rejected
    },
    async initializeFCM() {
      try {
        // Only initialize FCM if user is logged in
        const token = localStorage.getItem("accesstoken") || localStorage.getItem("token");
        if (!token) {
          console.log("User not logged in. Skipping FCM initialization.");
          return;
        }

        console.log("Initializing FCM...");
        const fcmToken = await FCMService.initialize();
        
        if (fcmToken) {
          console.log("FCM initialized successfully with token:", fcmToken);
        } else {
          console.log("FCM initialization completed but no token was generated");
        }
      } catch (error) {
        console.error("Error initializing FCM:", error);
      }
    },
    winStepper(windowData) {
      this.sideNav = windowData.sideNav;
    },
    socketAuth() {
      Socket.authFunction(this); // <---read data
    },
    getUser() {
      axios({
        method: "GET",
        url: "/users/profile",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          if (response.data.status) {
            this.$store.commit("userData", response.data.user);
          }
        })
        .catch(() => {});
    },
  },
  sockets: {
    connect() {
      // Fired when the socket connects.
      this.isConnected = true;
    },

    disconnect() {
      this.isConnected = false;
    },

    // Fired when the server sends something on the "messageChannel" channel.
    messageChannel(data) {
      this.socketMessage = data;
    },
  },
};
</script>
<style scoped>
/* Style for the WhatsApp Floating Button */
.whatsapp-button {
  position: fixed;
  bottom: 30px;
  /* Distance from the bottom of the screen */
  right: 20px;
  /* Distance from the right of the screen */
  z-index: 1000;
  /* Ensures it appears above other content */
}

.whatsapp-button img {
  width: 50px;
  /* Adjust size as needed */
  height: 50px;
  /* Adjust size as needed */
  cursor: pointer;
  border-radius: 60%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  /* Optional: Add shadow for better visibility */
  transition: transform 0.2s ease-in-out;
}

@media screen and (max-width: 600px) {
  .whatsapp-button img {
    width: 35px;
    /* Smaller width */
    height: 35px;
    /* Smaller height */
  }
}

.whatsapp-button img:hover {
  transform: scale(1.1);
}

.wtsphead {
  font-family: FajallaOne;
  color: #152e4f;
  font-weight: 400;
  font-size: 16px;
}
</style>

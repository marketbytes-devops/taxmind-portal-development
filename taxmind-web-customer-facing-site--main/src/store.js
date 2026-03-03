import Vue from "vue";
import Vuex from "vuex";
import router from "./router";
import FCMService from "./services/fcm";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isLoggedIn: false,
    userId: null,
    userRole: null,
    userName: null,
    userData: {},
    authentication: false,
  },
  mutations: {
    SET_AUTH(state, payload) {
      state.isLoggedIn = payload.isLoggedIn;
      state.userId = payload.userId;
      state.userRole = payload.userRole;
      state.userName = payload.userName;
    },
    SET_USER_DATA(state, userData) {
      state.userData = userData;
    },
    SET_AUTHENTICATION(state, status) {
      state.authentication = status;
    },
    CLEAR_AUTH(state) {
      state.isLoggedIn = false;
      state.userId = null;
      state.userRole = null;
      state.userName = null;
      state.userData = {};
      state.authentication = false;
    },
  },
  actions: {
    initializeAuth({ commit }) {
      const payload = {
        isLoggedIn: !!localStorage.getItem("accesstoken"),
        userId: localStorage.getItem("userId"),
        userRole: localStorage.getItem("userRole"),
        userName: localStorage.getItem("userName"),
      };
      commit("SET_AUTH", payload);
    },
    async loginUser({ commit }, userData) {
      console.log('[Store] loginUser action called with userData:', userData);
      localStorage.setItem("accesstoken", userData.token);
      localStorage.setItem("refreshtoken", userData.refreshToken);
      if (userData.userId) {
        localStorage.setItem("userId", userData.userId);
      }
      localStorage.setItem("userRole", userData.userRole);
      localStorage.setItem("userName", userData.userName);

      commit("SET_AUTH", {
        isLoggedIn: true,
        userId: userData.userId,
        userRole: userData.userRole,
        userName: userData.userName,
      });

      console.log('[Store] Access token saved, now initializing FCM...');
      
      // Initialize FCM and send token after login
      try {
        console.log('[Store] Calling FCMService.initialize()...');
        const fcmToken = await FCMService.initialize();
        if (fcmToken) {
          console.log('[Store] FCM token generated and sent to server after login');
        } else {
          console.log('[Store] FCM initialization completed but no token was returned');
        }
      } catch (error) {
        console.error('[Store] Error initializing FCM after login:', error);
      }

      // Only navigate if not explicitly disabled
      if (userData.skipNavigation !== true) {
        router.push("/profile");
      }
    },
    async logoutUser({ commit }) {
      try {
        // Import API client dynamically to avoid circular dependency
        const apiClient = await import("@/plugins/axios");
        await apiClient.default.get("/user/logout");
      } catch (error) {
        console.error("Logout failed:", error);
      }

      localStorage.removeItem("accesstoken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");

      commit("CLEAR_AUTH");
      router.push("/");
    },
    sessionOut({ commit }) {
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshtoken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      commit("CLEAR_AUTH");
      router.push("/login");
    },
  },
});

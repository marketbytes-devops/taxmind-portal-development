import Vue from "vue";
import Vuex from "vuex";
import router from "./router";
import { signIn as apiSignIn, signOut as apiSignOut } from "@/api/modules/auth";
import permissionService from "@/utils/permissions";
import { getAdminData } from "@/api/http";
import notifications from "./store/modules/notifications";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    notifications
  },
  state: {
    Sidebar_drawer: null,
    Customizer_drawer: false,
    SidebarColor: "#085AC6",
    SidebarBg: "",
    currentPage: 1,
    status: localStorage.getItem("usersFilterStatus") || "all",
    year: localStorage.getItem("usersFilterYear") ? parseInt(localStorage.getItem("usersFilterYear"), 10) : null,
    applicationsStatus: localStorage.getItem("applicationsFilterStatus") || null,
    applicationsYear: localStorage.getItem("applicationsFilterYear") || null,
    applicationsActiveTab: parseInt(localStorage.getItem("applicationsActiveTab")) || 0,
    isLoggedIn: !!localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    userData: {},
    authentication: false,
    isLoading: false,
    // RBAC state
    userPermissions: {},
    userRole: null,
    accessibleModules: [],
  },
  mutations: {
    SET_SIDEBAR_DRAWER(state, payload) {
      state.Sidebar_drawer = payload;
    },
    SET_CUSTOMIZER_DRAWER(state, payload) {
      state.Customizer_drawer = payload;
    },
    SET_SIDEBAR_COLOR(state, payload) {
      state.SidebarColor = payload;
    },
    authValue(state, item) {
      state.authentication = item;
    },
    loginUser(state, payload) {
      state.isLoggedIn = true;
      localStorage.setItem("isLoggedIn", payload);
    },
    logoutUser(state) {
      state.isLoggedIn = false;
      state.currentPage = null;
      localStorage.clear();
      // localStorage.removeItem("token");
      router.push("/Login");
    },
    changeUsersCurrentPage(state, item) {
      state.currentPage = item;
    },
    changeUsersStatus(state, item) {
      const value = item || "all";
      state.status = value;
      localStorage.setItem("usersFilterStatus", value);
    },
    changeUsersYear(state, item) {
      state.year = item;
      if (item !== null && item !== undefined && item !== "") {
        localStorage.setItem("usersFilterYear", String(item));
      } else {
        localStorage.removeItem("usersFilterYear");
      }
    },
    changeApplicationsCurrentPage(state, item) {
      state.currentPage = item;
    },
    changeApplicationsStatus(state, item) {
      state.applicationsStatus = item;
      localStorage.setItem("applicationsFilterStatus", item || "");
    },
    changeApplicationsYear(state, item) {
      state.applicationsYear = item;
      localStorage.setItem("applicationsFilterYear", item || "");
    },
    changeApplicationsActiveTab(state, item) {
      state.applicationsActiveTab = item;
      localStorage.setItem("applicationsActiveTab", item);
    },
    changeReviewsCurrentPage(state, item) {
      state.currentPage = item;
    },
    changeTaxcreditCurrentPage(state, item) {
      state.currentPage = item;
    },
    appLoading(state, payload) {
      // Handle app loading state (can be extended with loading state if needed)
      state.isLoading = payload;
    },
    userData(state, payload) {
      state.userData = payload;
      state.email = state.userData.email;
    },
    sessionOut(state) {
      state.itemsPerPage = null;
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      state.currentPage = null;
      state.isLoggedIn = false;
      // Clear RBAC state
      state.userPermissions = {};
      state.userRole = null;
      state.accessibleModules = [];
      router.push({ path: "/Login" });
    },
    // RBAC mutations
    SET_USER_PERMISSIONS(state, permissions) {
      state.userPermissions = permissions;
    },
    SET_USER_ROLE(state, role) {
      state.userRole = role;
    },
    SET_ACCESSIBLE_MODULES(state, modules) {
      state.accessibleModules = modules;
    },
    CLEAR_RBAC_STATE(state) {
      state.userPermissions = {};
      state.userRole = null;
      state.accessibleModules = [];
    },
  },
  actions: {
    async signIn({ commit, dispatch }, { email, password }) {
      const res = await apiSignIn({ email, password });
      commit("loginUser", res?.data?.accessToken);
      
      // Initialize RBAC after successful login
      await dispatch("initializeRBAC");
      
      // Register FCM token after login
      const fcmToken = localStorage.getItem('fcmToken');
      if (fcmToken) {
        console.log('Registering FCM token after login...');
        await dispatch('notifications/registerFCMToken', fcmToken);
      }
      
      // Fetch initial notifications
      try {
        await dispatch('notifications/fetchNotifications', { page: 1, size: 20 });
      } catch (error) {
        console.error('Error fetching initial notifications:', error);
      }
      
      return res;
    },
    async signOut({ commit }) {
      try {
        await apiSignOut();
      } catch (e) {
        /* ignore */
      }
      commit("CLEAR_RBAC_STATE");
      commit("logoutUser");
    },
    // RBAC actions
    async initializeRBAC({ commit }) {
      try {
        const adminData = getAdminData();
        if (adminData && adminData.role) {
          commit("SET_USER_ROLE", adminData.role);
          
          // Refresh permission service
          permissionService.refresh();
          
          // Get accessible modules
          const accessibleModules = permissionService.getAccessibleModules();
          commit("SET_ACCESSIBLE_MODULES", accessibleModules);
          
          // Build permissions map for Vuex
          const permissions = {};
          accessibleModules.forEach(module => {
            const modulePermissions = permissionService.getModulePermissions(module);
            permissions[module] = Array.from(modulePermissions);
          });
          commit("SET_USER_PERMISSIONS", permissions);
        }
      } catch (error) {
        console.error("Failed to initialize RBAC:", error);
      }
    },
    refreshPermissions({ dispatch }) {
      return dispatch("initializeRBAC");
    },
  },
});

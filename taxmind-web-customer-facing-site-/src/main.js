import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./router";
import axios from "axios";
import store from "./store";
import VueMeta from "vue-meta";
import VueElementLoading from "vue-element-loading";
import ServerError from "./components/Common/500";
import ImageLoader from "./components/Common/imageLoader";
import PageLoader from "./components/Common/pageLoader";
import AOS from "aos";
import "aos/dist/aos.css";
import VueGtag from "vue-gtag";
import VueSignaturePad from "vue-signature-pad";
// import VueSocketIO from "vue-socket.io";

// Import our configured axios client
import apiClient from "./plugins/axios";
import ApiService from "./services/api";

// Set global axios defaults for components that haven't been migrated yet
axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL;
axios.defaults.timeout = parseInt(process.env.VUE_APP_API_TIMEOUT) || 30000;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

// Add request interceptor for authentication to global axios
axios.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accesstoken") || localStorage.getItem("token");
  if (token) {
    config.headers.token = token;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

store.dispatch("initializeAuth");
// Vue.use(
//   new VueSocketIO({
//     debug: process.env.NODE_ENV === "development",
//     connection: process.env.VUE_APP_SOCKET_URL,
//     vuex: {
//       store,
//       actionPrefix: "SOCKET_",
//       mutationPrefix: "SOCKET_",
//     },
//     options: { path: process.env.VUE_APP_SOCKET_PATH },
//   })
// );

// const socket = Vue.prototype.$socket;

// socket.on("connect", () => {
//   console.log("Successfully connected to the socket server");
// });

// socket.on("connect_error", (error) => {
//   console.error("Failed to connect to the socket server:", error);
// });

Vue.use(VueSignaturePad);
Vue.component("ServerError", ServerError);
Vue.component("ImageLoader", ImageLoader);
Vue.component("PageLoader", PageLoader);
Vue.component("VueElementLoading", VueElementLoading);
import OwlCarousel from "vue-owl-carousel";
Vue.component("OwlCarousel", OwlCarousel);
Vue.use(VueGtag, {
  config: { id: "G-FG6BLD3LBQ" },
});
Vue.use(VueMeta, {
  // optional pluginOptions
  refreshOnceOnNavigation: true,
});

Vue.config.productionTip = false;

// Setup global API client and services
Vue.prototype.$api = apiClient;
Vue.prototype.$apiService = ApiService;

// Environment-based URLs
Vue.prototype.ipURL = process.env.VUE_APP_API_BASE_URL;
Vue.prototype.mediaURL = process.env.VUE_APP_MEDIA_URL;
Vue.prototype.fileURL = process.env.VUE_APP_FILE_URL;

// Backward compatibility - many components still use window.axios
// Use globally configured axios instance
window.axios = axios;

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
  // mounted() {
  //     AOS.init()
  // },
  mounted() {
    this.$router.afterEach((to) => {
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("config", "G-FFJZP4XXY9", {
          page_path: to.fullPath,
        });
      }
    });
    AOS.init();
  },
}).$mount("#app");

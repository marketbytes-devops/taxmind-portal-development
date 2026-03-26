<template>
  <div style="background-color: #f1f7ff">
    <ServerError v-if="ServerError" />

    <v-app
      id="materialpro"
      :class="`${
        !$vuetify.breakpoint.smAndDown ? 'full-sidebar' : 'mini-sidebar'
      }`"
      style="background-color: #f1f7ff"
    >
      <router-view />
    </v-app>
  </div>
</template>

<script>
// import axios from "axios";
// import store from "./store";
import "./assets/styles/fonts.css";
import "./assets/styles/appStyle.css";
import Socket from "./Sockets/socket";

export default {
  name: "App",
  components: {},
  data() {
    return {
      ServerError: false,
      showsnackbar: false,
      showsnackbar1: false,
      msg: null,
      timeout: 20000,
    };
  },
  mounted() {
    this.socketAuth();
  },
  computed: {
    authValue() {
      return this.$store.state.authentication;
    },
  },
  watch: {
    authValue() {
      if (this.authValue == false) this.socketAuth();
    },
  },
  // beforeMount() {
  //   if (typeof localStorage.getItem("token") == "string") {
  //     axios({
  //       method: "GET",
  //       url: "/user/me",
  //       headers: {
  //         token: localStorage.getItem("token"),
  //       },
  //     })
  //       .then((response) => {
  //         if (response.data.status) {
  //           store.commit("userData", response.data.data);
  //           store.commit("userType", response.data.data.type);
  //         }
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   }
  // },
  methods: {
    socketAuth() {
      Socket.authFunction(this); // <---read data
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

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: DM Sans !important;
  letter-spacing: 0px !important;
}
.full-height {
  height: 100%;
}
.v-application {
  min-height: 100vh;
}
.v-rating .v-icon {
  padding: 0px !important;
}
</style>

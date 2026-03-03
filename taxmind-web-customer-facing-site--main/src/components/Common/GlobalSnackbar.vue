<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    top
    :color="color"
    elevation="4"
    class="snackbar-center"
  >
    <v-layout align-center>
      <v-flex align-self-center xs1>
        <v-icon left v-if="icon" class="mr-2">{{ icon }}</v-icon>
      </v-flex>
      <v-flex align-self-center xs10>
        <span>{{ message }}</span>
      </v-flex>
      <v-flex align-self-center xs1>
        <v-icon @click="show = false" left class="mr-2">mdi-close</v-icon>
      </v-flex>
    </v-layout>

    <!-- <v-btn text color="white" @click="show = false">
      Close
    </v-btn> -->
  </v-snackbar>
</template>

<script>
import Vue from "vue";

export default {
  name: "GlobalSnackbar",
  data() {
    return {
      show: false,
      message: "",
      color: "#1A73E9",
      timeout: 5000,
      icon: null,
    };
  },
  methods: {
    showSuccess(msg, opts = {}) {
      this.message = msg || "";
      this.color = opts.color || "green darken-1";
      this.icon = opts.icon || "mdi-check-circle";
      this.timeout = typeof opts.timeout === "number" ? opts.timeout : 3000;
      this.show = true;
    },
    showError(msg, opts = {}) {
      this.message = msg || "";
      this.color = opts.color || "red darken-1";
      this.icon = opts.icon || "mdi-alert-circle";
      this.timeout = typeof opts.timeout === "number" ? opts.timeout : 3000;
      this.show = true;
    },
    // Accept either a plain string or an API response / error object.
    // If an object is provided, prefer backend-provided `error` or `message` fields.
    showApiError(payload, opts = {}) {
      let txt = "";
      if (!payload) txt = "";
      else if (typeof payload === "string") txt = payload;
      else {
        // Check common nested locations used by various backends and wrapper clients
        const resp = payload.response || payload;
        // response.data may itself be nested or contain 'data'
        let data = resp?.data;

        // If response data is a JSON string, try to parse it
        if (typeof data === "string") {
          try {
            const parsed = JSON.parse(data);
            data = parsed;
          } catch (parseErr) {
            // not JSON, ignore
          }
        }

        // 1) payload.response.data.data.message (some APIs nest data)
        if (data && data.data && (data.data.error || data.data.message)) {
          txt = data.data.error || data.data.message;
        }
        // 2) payload.response.data.message / payload.response.data.error
        else if (data && (data.error || data.message)) {
          txt = data.error || data.message;
        }
        // 3) payload.data.message / payload.data.error (payload may be a response.data object)
        else if (payload.data && (payload.data.error || payload.data.message)) {
          txt = payload.data.error || payload.data.message;
        }
        // 3b) errors array (common validation format)
        else if (data && Array.isArray(data.errors) && data.errors.length > 0) {
          const first = data.errors[0];
          if (typeof first === "string") txt = first;
          else if (first.message) txt = first.message;
          else if (first.msg) txt = first.msg;
        }
        // 4) top-level error or message fields
        else if (payload.error) txt = payload.error;
        else if (payload.message) txt = payload.message;
        // 5) fallback to response.message (rare)
        else if (resp && resp.message) txt = resp.message;
        else txt = "An unexpected error occurred.";
      }

      // Show the extracted text using existing error styling
      this.showError(txt, opts);
    },
    // Show only backend-provided success messages. If none present, do nothing.
    showApiSuccess(payload, opts = {}) {
      let txt = "";
      if (!payload) txt = "";
      else if (typeof payload === "string") txt = payload;
      else if (payload.message) txt = payload.message;
      else if (payload.data && (payload.data.message || payload.data.success)) {
        txt = payload.data.message || (payload.data.success === true ? "" : "");
      } else if (
        payload.response &&
        payload.response.data &&
        payload.response.data.message
      ) {
        txt = payload.response.data.message;
      } else {
        txt = "";
      }

      if (txt) this.showSuccess(txt, opts);
    },
  },
  mounted() {
    // Expose simple API globally so any component can call this.$snackbar.showSuccess()
    Vue.prototype.$snackbar = {
      showSuccess: this.showSuccess.bind(this),
      showError: this.showError.bind(this),
      showApiError: this.showApiError.bind(this),
      showApiSuccess: this.showApiSuccess.bind(this),
    };
  },
  beforeDestroy() {
    if (Vue.prototype.$snackbar) {
      delete Vue.prototype.$snackbar;
    }
  },
};
</script>

<style scoped>
/* keep centered using global utility class defined in appStyle.css */
</style>

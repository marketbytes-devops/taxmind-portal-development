<template>
  <v-snackbar
    v-model="show"
    :timeout="-1"
    color="#043A82"
    class="cookie-consent"
  >
    <v-layout align-center>
      <v-icon color="white" size="30" class="mr-3">mdi-cookie</v-icon>
      <span class="text-body-1 font-weight-medium white--text">
        This website uses cookies to ensure you get the best experience. By continuing, you agree to our cookie policy.
      </span>
    </v-layout>

    <v-divider class="my-3 white"></v-divider>

    <v-layout justify-end>
      <v-btn
        class="accept-btn"
        plain
        @click="acceptCookies"
      >
        Accept
      </v-btn>
    </v-layout>
  </v-snackbar>
</template>

<script>
export default {
  name: 'CookieConsent',
  data: () => ({
    show: false
  }),
  mounted() {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setTimeout(() => {
        this.show = true;
      }, 1000);
    }
  },
  methods: {
    acceptCookies() {
      localStorage.setItem('cookieConsent', 'accepted');
      this.show = false;
      this.$emit('cookies-accepted');
    }
  }
};
</script>

<style scoped>
.cookie-consent {
  border-radius: 8px;
}

.accept-btn {
  color: white;
  text-transform: uppercase;
}
</style>

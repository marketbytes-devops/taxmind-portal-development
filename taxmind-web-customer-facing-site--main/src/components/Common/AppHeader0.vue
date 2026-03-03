<template>
  <div>
    <v-layout
      wrap
      justify-center
      fill-height
      py-2
      style="background-color: #1a73e9"
    >
      <v-flex xs12 sm12 md12 lg12 align-self-center text-left>
        <v-layout wrap justify-center>
          <v-flex xs6 sm3 md3 lg2 align-self-center text-center>
            <v-icon small style="color: white">mdi-phone</v-icon>
            &nbsp;<span class="topText">{{ headerData.phone }}</span>
          </v-flex>
          <v-flex xs6 sm3 md3 lg2 align-self-center text-center>
            <v-icon small style="color: white">mdi-email</v-icon>
            &nbsp;<a :href="'mailto:' + headerData.email" class="topText">{{
              headerData.email
            }}</a>
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex
            xs4
            sm4
            md4
            lg3
            text-center
            align-self-center
            class="hidden-xs-only"
          >
            <v-layout wrap justify-end>
              <v-flex xs3 sm1 v-for="(item, i) in headerIcons" :key="i">
                <v-img
                  v-if="item.iconUrl"
                  :src="item.iconUrl"
                  height="18px"
                  width="18px"
                  @click="openUrl(item.url)"
                  style="cursor: pointer"
                ></v-img>
                <v-img
                  v-else
                  :src="mediaURL + (item.icon || '')"
                  height="18px"
                  width="18px"
                  @click="openUrl(item.url)"
                  style="cursor: pointer"
                ></v-img>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>
    <script>
import axios from "axios";

export default {
  components: {},
  data() {
    return {
      items: [
        { icon: require("./../../assets/icons/kIn.png") },
        { icon: require("./../../assets/icons/kX.png") },
        { icon: require("./../../assets/icons/kFb.png") },
      ],
      headerData: {},
      headerIcons: [],
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    async getData() {
      this.appLoading = true;
      try {
        // Use Promise.all to fetch both endpoints concurrently
        const [configResponse, socialResponse] = await Promise.all([
          axios.get("/site-contents/config"),
          axios.get("/site-contents/social-media"),
        ]);

        // Map new data structure to existing component expectations
        const cfg =
          (configResponse.data &&
            (configResponse.data.data || configResponse.data)) ||
          {};
        this.headerData = {
          phone: cfg.headerPhone || cfg.headerPhone || "",
          email: cfg.headerEmail || cfg.headerEmail || "",
        };

        // Map social media data (array). Resolve icon filePath or key to a usable URL
        const socials =
          (socialResponse.data &&
            (socialResponse.data.data || socialResponse.data)) ||
          [];
        this.headerIcons = socials.map((item) => {
          let iconUrl = null;
          try {
            if (item.icon) {
              // If icon is an object with filePath
              if (typeof item.icon === "object") {
                iconUrl =
                  item.icon.filePath ||
                  (item.icon.key ? this.mediaURL + item.icon.key : null);
              } else if (typeof item.icon === "string") {
                // If icon is a string (filename/key)
                iconUrl = item.icon.startsWith("http")
                  ? item.icon
                  : this.mediaURL + item.icon;
              }
            }
          } catch (e) {
            iconUrl = null;
          }

          return {
            iconUrl,
            icon: item.icon,
            url: item.url,
          };
        });

        this.appLoading = false;
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 500) {
            // Handle server error
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else if (err.response.status === 422) {
            // Handle validation error
            this.ServerError = false;
            this.msg = err.response?.data?.message || "";
          } else {
            // Handle other errors
            this.ServerError = false;
            this.msg = err.response?.data?.message || "";
          }
        } else {
          // Fallback for cases where err.response is undefined
          this.ServerError = true;
          this.msg = "An unexpected error occurred. Please try again.";
        }
        this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
      }
    },
    openUrl(url) {
      window.open(url, "_blank");
    },
  },
};
</script>
    <style >
.v-toolbar__content {
  padding: 0px !important;
}
.topText {
  color: white !important;
  font-family: DMSans;
  font-weight: 500;
  font-size: 14px;
}
.topText a {
  color: white !important;
  text-decoration: none;
}
</style>

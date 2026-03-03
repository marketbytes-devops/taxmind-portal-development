<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="#1A73E9"
      size="60"
      is-full-screen
    />
    <!-- Global snackbar mounted in App.vue; use this.$snackbar.showSuccess()/showError() -->
    <v-layout wrap justify-center pt-10 pb-10>
      <v-flex xs12 pa-6>
        <v-layout wrap justify-center>
          <v-flex xs12 lg11 md11 sm10>
            <v-layout wrap justify-center>
              <v-flex xs12 text-left>
                <span
                  style="
                    font-family: FajallaOne;
                    font-weight: 400;
                    font-size: 30px;
                    line-height: 37.71px;
                  "
                >
                  Organized Tax Categories Made
                  <span style="color: #1a73e9">Simple</span>
                </span>
              </v-flex>
              <v-flex xs12 text-left pt-2>
                <span
                  style="
                    font-family: DMSans;
                    font-weight: 400;
                    font-size: 18px;
                    line-height: 23.44px;
                  "
                >
                  A complete breakdown of tax types for personalized financial
                  insights
                </span>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-start pt-5 class="horizontall">
              <v-flex
                xs12
                sm6
                md4
                lg2
                pa-2
                v-for="item in taxcreditdata"
                :key="item.id || item.slug"
              >
                <v-card
                  elevation="0"
                  rounded="xl"
                  height="250px"
                  color="#EBF2FF"
                  class="hover-card"
                  @click="redirectToPage(item.id)"
                >
                  <!-- Icon and Name (Hidden on Hover) -->
                  <v-layout wrap justify-center class="card-content">
                    <v-flex xs12>
                      <v-layout wrap justify-center>
                        <v-flex xs11 sm11 md11 lg12 px-16 pt-8>
                          <v-card rounded="xl">
                            <v-layout wrap justify-center>
                              <v-flex xs12 sm10 md12 pa-5>
                                <v-img
                                  contain
                                  :src="getIconUrl(item.icon)"
                                  lazy-src="@/assets/images/whitebg.png"
                                  @loadstart="isLoaded = false"
                                  @load="isLoaded = true"
                                  class="custom-img"
                                ></v-img>
                              </v-flex>
                            </v-layout>
                          </v-card>
                        </v-flex>
                        <v-flex xs11 sm10 class="text-center" pb-5 pt-10>
                          <span
                            style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                              line-height: 23.44px;
                              color: #000000;
                            "
                            :title="item.name"
                          >
                            {{ truncateName(item.name) }}
                          </span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <!-- Hover Text -->
                  <v-layout wrap justify-center class="hover-text">
                    <v-flex xs12>
                      <span>{{ truncateDescription(item.description) }}</span>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>  
<script>
import { ApiMigrationMixin } from "@/utils/apiMigration";

export default {
  mixins: [ApiMigrationMixin],
  data() {
    return {
      ServerError: false,
      taxcreditdata: [],
      items: [],
      appLoading: false,
      isLoaded: false,
    };
  },
  beforeMount() {
    this.getData();
  },
  methods: {
    onImageLoad() {
      this.isLoaded = true;
    },
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/site-contents/tax-credits", {
          params: {
            page: 1,
            size: 50,
          },
        });
        this.appLoading = false;

        // Handle TAXMIND.json response structure
        if (response.data && Array.isArray(response.data)) {
          this.taxcreditdata = response.data;
        } else {
          console.warn("Unexpected response structure:", response);
          this.taxcreditdata = [];
        }

        // Log metadata if available (removed empty block)
        // Metadata handling can be added here if needed in the future
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 422) {
            // Handle validation error
            this.ServerError = false;
            this.msg = err.response?.data?.message || "";
          } else if (err.response.status === 500) {
            // Handle server error
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            // Handle other errors
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
        } else {
          // Fallback for cases where err.response is undefined
          this.ServerError = true;
          this.msg = "An unexpected error occurred. Please try again.";
        }
        this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
      }
    },
    redirectToPage(id) {
      // Use UUID for routing as per TAXMIND.json API specification
      this.$router.push("/tax-details/" + id);
    },
    truncateDescription(text) {
      const words = text.split(" ");
      if (words.length > 40) {
        return words.slice(0, 40).join(" ") + "...";
      }
      return text;
    },
    truncateName(text, maxLength = 20) {
      if (!text) return "";
      if (text.length <= maxLength) {
        return text;
      }
      return text.substring(0, maxLength).trim() + "...";
    },
    getIconUrl(icon) {
      if (!icon) return "";

      // If icon is a string, handle URL or relative path
      if (typeof icon === "string") {
        if (icon.startsWith("http://") || icon.startsWith("https://")) {
          return icon;
        }
        return this.mediaURL + icon;
      }

      // If icon is an array, try the first element
      if (Array.isArray(icon) && icon.length > 0) {
        return this.getIconUrl(icon[0]);
      }

      // If icon is an object, try common properties
      if (typeof icon === "object") {
        // Direct full URL field used by API
        if (typeof icon.filePath === "string" && icon.filePath.length > 0) {
          return icon.filePath;
        }
        // If API returns a storage key, prepend mediaURL
        if (typeof icon.key === "string" && icon.key.length > 0) {
          return this.mediaURL + icon.key;
        }
        // Common fields that might contain the path/url
        const candidates = [
          "url",
          "filePath",
          "path",
          "file",
          "src",
          "source",
          "media",
          "key",
          "name",
        ];
        for (const key of candidates) {
          const val = icon[key];
          if (typeof val === "string" && val.length > 0) {
            return this.getIconUrl(val);
          }
        }

        // Sometimes API returns nested objects, try a few known shapes
        if (icon.data) {
          return this.getIconUrl(icon.data);
        }
        if (icon.attributes && icon.attributes.url) {
          return this.getIconUrl(icon.attributes.url);
        }
      }

      // Fallback: unknown type, return empty string and log for debugging
      // console.warn("Unexpected icon format:", icon);
      return "";
    },
  },
};
</script>
<style scoped>
.hover-card {
  position: relative;
  overflow: hidden;
  background-color: #ebf2ff; /* Default color */
  transition: background-color 0.3s ease-in-out;
}

.hover-card:hover {
  background-color: #152e4f !important; /* Change background color on hover */
}

.card-content {
  transition: opacity 0.3s ease-in-out;
}

.hover-card:hover .card-content {
  opacity: 0; /* Hide icon and name on hover */
}

.hover-text {
  position: absolute;
  top: 10%;
  left: 10%;
  right: 10%;
  font-family: DMSans;
  font-weight: 600;
  font-size: 12px;
  color: #ffffff;
  text-align: justify;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.hover-card:hover .hover-text {
  opacity: 1; /* Show text on hover */
}

.horizontall {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  overflow-x: auto;
}
.horizontall::-webkit-scrollbar {
  height: 0px !important;
}

.horizontall::-webkit-scrollbar-track {
  background-color: rgba(223, 223, 223, 0.47);
}

.horizontall::-webkit-scrollbar-thumb {
  background-color: rgb(255, 255, 255);
}
.custom-img {
  height: auto;
  width: 100%;
  aspect-ratio: 50/51;
}
@media (max-width: 770px) {
  .custom-img {
    height: 45px;
    width: 45px;
  }
}
</style>

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
    <!-- Global snackbar used via this.$snackbar -->

    <!-- Hidden image preloader -->
    <div style="display: none">
      <img
        v-for="(item, index) in items"
        :key="'preload-' + index"
        :src="item.startsWith('http') ? item : mediaURL + item"
        @load="handleImageLoad(index)"
        @error="handleImageError(index, item)"
      />
    </div>

    <v-layout wrap justify-center pt-8 pt-md-3>
      <v-flex xs12>
        <v-layout wrap justify-center>
          <v-flex xs12>
            <!-- Loading state -->
            <div v-if="!allImagesLoaded" class="loading-container">
              <v-progress-circular
                indeterminate
                color="#1A73E9"
                size="50"
              ></v-progress-circular>
            </div>

            <!-- Carousel (only shown when all images are loaded) -->
            <v-carousel
              v-show="allImagesLoaded"
              :show-arrows="false"
              hide-delimiters
              :interval="5000"
              cycle
              class="carousel-fade"
            >
              <v-carousel-item
                v-for="(item, i) in items"
                :key="i"
                :src="item.startsWith('http') ? item : mediaURL + item"
                class="carousel-item-custom"
              >
                <v-layout
                  wrap
                  justify-start
                  pt-lg-16
                  pt-sm-10
                  pt-md-10
                  pt-16
                  pa-1
                >
                  <v-flex xs12>
                    <v-layout
                      wrap
                      justify-start
                      pt-lg-10
                      pt-sm-16
                      pt-md-16
                      pt-3
                    >
                      <v-flex
                        xs12
                        lg8
                        md10
                        sm10
                        pl-lg-10
                        pl-md-10
                        pl-sm-10
                        pl-3
                        pr-3
                        pr-sm-0
                      >
                        <v-layout wrap justify-start pl-lg-10 pl-md-10 pl-sm-10>
                          <v-flex xs12>
                            <span
                              style="
                                font-family: DMSans;
                                font-weight: 500;
                                font-size: 20px;
                                text-align: justify;
                              "
                              v-html="homeCarousel.title"
                            ></span>
                          </v-flex>
                          <v-flex xs12>
                            <span
                              class="home-carousel-content"
                              v-html="homeCarousel.content"
                            ></span>
                          </v-flex>
                          <v-flex xs12>
                            <v-layout wrap justify-start>
                              <v-flex xs5 lg2 md2 sm2 v-if="loggedIn === false">
                                <v-btn
                                  color="#1A73E9"
                                  rounded
                                  @click="navigateToPage"
                                  to="/apply-now"
                                >
                                  <span
                                    style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 18px;
                                      color: #ffffff;
                                    "
                                    >Apply Now</span
                                  >
                                </v-btn>
                              </v-flex>
                            </v-layout>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
              </v-carousel-item>
            </v-carousel>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>

    <v-layout wrap justify-center style="background-color: #152e4f">
      <v-flex xs12 lg11 pa-5>
        <v-layout wrap justify-center>
          <v-flex
            xs12
            lg12
            sm10
            md11
            pl-sm-2
            pl-md-7
            pl-lg-1
            text-left
            align-self-center
          >
            <v-icon color="white">mdi-check-decagram</v-icon> &nbsp;
            <span
              style="
                font-family: FajallaOne;
                font-weight: 400;
                font-size: 20px;
                color: white;
              "
              >Trusted by thousands of happy clients, Taxen delivers secure,
              compliant, and hassle-free tax refund services you can depend on —
              every time</span
            >
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
      carousaldata: [],
      homeCarousel: {},
      items: [],
      // Global snackbar used via this.$snackbar
      appLoading: false,
      loadedImages: {},
      allImagesLoaded: false,
    };
  },
  beforeMount() {
    this.getData();
  },
  computed: {
    loggedIn() {
      return this.$store.state.isLoggedIn;
    },
  },
  methods: {
    navigateToPage() {
      this.$router.push({ name: "apply-now" });
    },
    handleImageLoad(index) {
      this.loadedImages[index] = true;
      this.checkAllImagesLoaded();
    },
    handleImageError(index, item) {
      const imageUrl = item.startsWith("http") ? item : this.mediaURL + item;
      console.error(`Failed to load image ${index}:`, imageUrl);
      this.loadedImages[index] = true; // Mark as "handled" even if failed
      this.checkAllImagesLoaded();
    },
    checkAllImagesLoaded() {
      const loadedCount = Object.keys(this.loadedImages).length;

      if (loadedCount === this.items.length) {
        this.allImagesLoaded = true;
      }
    },
    async getData() {
      try {
        const [imagesResponse, configResponse] = await Promise.all([
          this.fetchData("/site-contents/carousel-images"),
          this.fetchData("/site-contents/config"),
        ]);

        // Extract carousel images from nested structure
        this.items = imagesResponse.data
          .map((item) => {
            // The filePath contains the full S3 URL with signed parameters
            // Support shapes: item.image.filePath, item.filePath, item.url, or item.key
            const imagePath =
              item.image?.filePath ||
              item.image?.path ||
              item.image?.url ||
              item.filePath ||
              item.path ||
              item.url ||
              (item.image?.key ? this.mediaURL + item.image.key : null) ||
              (item.key ? this.mediaURL + item.key : null);
            return imagePath;
          })
          .filter(Boolean); // Remove any undefined/null values

        // Extract carousel content from config
        const cfg = configResponse.data || {};
        this.homeCarousel = {
          title:
            cfg.homeTitle || (cfg.homeCarousel && cfg.homeCarousel.title) || "",
          content:
            cfg.homeContent ||
            (cfg.homeCarousel && cfg.homeCarousel.content) ||
            "",
        };

        this.loadedImages = {};
        this.allImagesLoaded = false;

        // If no images, show error
        if (this.items.length === 0) {
          console.warn("No carousel images found in API response");
          this.allImagesLoaded = true; // Stop loading state
        }
      } catch (error) {
        // Error handling is automatically done by fetchData method from ApiMigrationMixin
        console.error("Failed to load carousel data:", error);
        this.allImagesLoaded = true; // Stop loading state on error
        this.$snackbar.showError("Failed to load carousel data.");
      }
    },
  },
};
</script>

<style>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background-color: #f5f5f5;
}

.carousel-fade {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.carousel-fade:not([style*="display: none"]) {
  opacity: 1;
}

.carousel-item-custom {
  transition: opacity 0.5s ease-in-out;
}

.v-carousel__item {
  transition: opacity 0.5s ease-in-out !important;
}

.home-carousel-content {
  font-family: FajallaOne;
  font-weight: 400;
  font-size: 45px;
  text-align: justify;
}
@media (max-width: 800px) {
  .home-carousel-content {
    font-size: 30px;
  }
}

@media (max-width: 600px) {
  .home-carousel-content {
    font-size: 23px;
  }

  .loading-container {
    min-height: 300px;
  }
}
</style>

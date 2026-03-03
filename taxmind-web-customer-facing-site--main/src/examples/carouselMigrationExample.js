/**
 * Example: Carousel Component Migration
 * Shows how to migrate from old axios usage to new API client
 */

// BEFORE - Old Implementation
const oldCarouselMethods = {
  getData() {
    this.appLoading = true;
    axios({
      url: "/v1/guest/webpage/get-home",
      method: "GET",
      headers: {
        token: localStorage.getItem("token"),
      },
    })
      .then((response) => {
        this.appLoading = false;
        this.carousaldata = response.data.data;
        this.homeCarousel = this.carousaldata.webpage.homeCarousel;
        this.items = this.homeCarousel.images;
        this.loadedImages = {};
        this.allImagesLoaded = false;
      })
      .catch((err) => {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 500) {
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            this.ServerError = false;
            this.msg = err.response.data.message || "An error occurred.";
          }
        } else {
          this.ServerError = true;
          this.msg = "An unexpected error occurred. Please try again.";
        }
        try {
          this.$snackbar.showError(this.msg || "An unexpected error occurred.");
        } catch (e) {
          console.log("Snackbar not available", e);
        }
        console.log(err);
      });
  },
};

// AFTER - New Implementation with API Client
const newCarouselMethods = {
  async getData() {
    try {
      const response = await this.fetchData("/v1/guest/webpage/get-home");
      this.carousaldata = response.data;
      this.homeCarousel = this.carousaldata.webpage.homeCarousel;
      this.items = this.homeCarousel.images;
      this.loadedImages = {};
      this.allImagesLoaded = false;
    } catch (error) {
      // Error handling is done automatically by fetchData method
    }
  },

  // Alternative using direct API service
  async getDataWithService() {
    try {
      this.appLoading = true;
      const response = await this.$apiService.legacy.getHomePage();
      this.carousaldata = response.data.data;
      this.homeCarousel = this.carousaldata.webpage.homeCarousel;
      this.items = this.homeCarousel.images;
      this.loadedImages = {};
      this.allImagesLoaded = false;
    } catch (error) {
      this.handleApiError(error, "Loading carousel data");
    } finally {
      this.appLoading = false;
    }
  },

  // Using new site-contents API (future migration)
  async getDataNew() {
    try {
      this.appLoading = true;
      const [imagesResponse, configResponse] = await Promise.all([
        this.$apiService.siteContent.getCarouselImages(),
        this.$apiService.siteContent.getConfig(),
      ]);

      this.carouselImages = imagesResponse.data.data || [];
      this.items = this.carouselImages.map((img) => img.path);

      const configData = configResponse.data.data || {};
      this.homeCarousel = {
        title: configData.homeTitle || "Welcome to TaxMind",
        content: configData.homeContent || "",
      };

      this.loadedImages = {};
      this.allImagesLoaded = false;
    } catch (error) {
      this.handleApiError(error, "Loading carousel data");
    } finally {
      this.appLoading = false;
    }
  },
};

export { oldCarouselMethods, newCarouselMethods };

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
    <v-layout wrap justify-center pt-1 pt-sm-6 pt-md-16>
      <v-flex xs12 pt-3 pt-sm-3 pt-md-3>
        <v-layout
          wrap
          justify-center
          pt-3
          pt-sm-0
          pt-md-0
          class="hidden-sm-and-down"
        >
          <v-flex xs12 pt-16>
            <v-img
              src="./../../assets/images/blogstopimage.webp"
              contain
              alt="blogstop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">BLOGS</span>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-img>
          </v-flex>
        </v-layout>
        <v-layout
          wrap
          justify-center
          pt-5
          pt-sm-0
          pt-md-0
          class="hidden-md-and-up"
        >
          <v-flex xs12 pt-16>
            <v-img
              src="./../../assets/images/blogstopimagesmall.webp"
              contain
              alt="blogstop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">BLOGS</span>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-img>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-start>
      <v-flex xs12>
        <v-layout wrap justify-center pt-10 pb-16>
          <v-flex xs11 lg10 sm10>
            <v-layout wrap justify-center>
              <v-flex xs12 lg12 sm12>
                <v-layout wrap justify-center>
                  <v-flex
                    xs12
                    lg4
                    sm6
                    pa-2
                    v-for="(blog, index) in blogs"
                    :key="index"
                    style="cursor: pointer"
                    @click="redirectToBlog(blog.slug)"
                  >
                    <v-card elevation="0" style="background-color: #f7f9ff">
                      <v-layout wrap justify-center>
                        <v-flex xs12 v-if="blog.image">
                          <v-img
                            :src="getImageUrl(blog.image)"
                            contain
                            :lazy-src="getImageUrl(blog.image)"
                            @loadstart="isLoaded = false"
                            @load="isLoaded = true"
                            style="
                              height: auto;
                              width: 100%;
                              aspect-ratio: 447/250;
                            "
                          >
                            <template v-slot:placeholder>
                              <ImageLoader />
                            </template>
                          </v-img>
                        </v-flex>
                        <v-flex xs12 text-left pt-3 pb-3>
                          <span
                            style="
                              font-family: DMSans;
                              font-weight: 700;
                              font-size: 22px;
                            "
                          >
                            {{ trimText(blog.title, 36) }}
                          </span>
                        </v-flex>
                        <v-flex xs12 text-left pb-3>
                          <span>
                            <v-icon color="#1A73E9">mdi-calendar-month</v-icon>
                            <span
                              style="
                                font-family: RobotoRegular;
                                font-size: 16px;
                                color: #777777;
                              "
                            >
                              {{ formatDate(blog.updatedAt) }}
                            </span>
                          </span>
                        </v-flex>
                        <v-flex xs12 text-left pb-3>
                          <span
                            style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            "
                            v-html="
                              trimText(
                                blog.seoDescription ||
                                  'No description available',
                                90
                              )
                            "
                          >
                          </span>
                        </v-flex>
                      </v-layout>
                    </v-card>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        <v-layout wrap justify-center pb-16>
          <v-flex xs12 text-center>
            <div class="text-center pb-5" v-if="pages > 1">
              <v-pagination
                :length="pages"
                v-model="currentPage"
                color="#1A73E9"
                circle
              ></v-pagination>
            </div>
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
  metaInfo: {
    title: "TaxMind Blogs - Expert Insights on Tax & Finance",
    meta: [
      {
        name: "description",
        content:
          "Stay updated with the latest tax and finance insights from TaxMind Blogs. Get expert tips, updates on tax laws, and financial planning strategies.",
      },
      {
        name: "keywords",
        content:
          "tax blogs, finance insights, tax news, financial planning, tax tips, tax law updates, business finance, personal finance, TaxMind articles",
      },
      {
        property: "og:title",
        content: "TaxMind Blogs - Stay Informed on Tax & Finance",
      },
      {
        property: "og:description",
        content:
          "Explore expert tax and finance articles on TaxMind Blogs. Learn about tax-saving strategies, legal updates, and financial planning for businesses & individuals.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/blogs", // Replace with your actual blog page URL
      },
      {
        property: "og:type",
        content: "website",
      },
      { name: "robots", content: "index, follow" },
    ],
  },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      // Global snackbar used via this.$snackbar
      blogs: [],
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 12,
    };
  },
  beforeMount() {
    this.getData();
  },
  watch: {
    currentPage() {
      this.getData();
    },
  },
  methods: {
    trimText(text, length) {
      if (!text) return "No content available";
      return text.length > length ? text.substring(0, length) + "..." : text;
    },
    getImageUrl(image) {
      if (!image) return "";
      // If filePath exists (S3 signed URL), use it directly
      if (image.filePath) return image.filePath;
      // If key exists, use with mediaURL
      if (image.key) return this.mediaURL + image.key;
      // If it's a string (old format), use with mediaURL
      if (typeof image === "string") return this.mediaURL + image;
      return "";
    },
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/blogs", {
          params: {
            status: "published",
            page: this.currentPage,
            size: this.limit,
          },
        });
        this.appLoading = false;
        this.blogs = response.data;
        this.pages = Math.ceil(response.metadata?.total / this.limit) || 1;
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 422) {
            // Handle validation error
            this.ServerError = false;
            try {
              if (
                this.$snackbar &&
                typeof this.$snackbar.showApiError === "function"
              ) {
                this.$snackbar.showApiError(err);
              } else {
                this.$snackbar.showError(err.response.data.message || "");
              }
            } catch (e) {
              this.$snackbar.showError(err.response?.data?.message || "");
            }
          } else if (err.response.status === 500) {
            // Handle server error
            this.ServerError = true;
            this.$snackbar.showError(
              "A server error occurred. Please try again later."
            );
          } else {
            // Handle other errors
            this.ServerError = true;
            this.$snackbar.showError(
              "An unexpected error occurred. Please try again."
            );
          }
        } else {
          // Fallback for cases where err.response is undefined
          this.ServerError = true;
          this.$snackbar.showError(
            "An unexpected error occurred. Please try again."
          );
        }
      }
    },
    formatDate(date) {
      const dt = new Date(date);
      const day = dt.getDate().toString().padStart(2, "0");
      const month = dt.toLocaleString("default", { month: "long" });
      const year = dt.getFullYear();
      const hours = dt.getHours().toString().padStart(2, "0");
      const minutes = dt.getMinutes().toString().padStart(2, "0");

      return `${day} ${month} ${year} | ${hours} : ${minutes}`;
    },
    redirectToBlog(url) {
      this.$router.push("/blogs/" + url);
    },
  },
};
</script>
<style scoped>
.blog-title {
  font-family: FajallaOne;
  font-weight: 400;
  font-size: 45px;
  text-transform: uppercase;
  color: white;
}

@media (max-width: 600px) {
  .blog-title {
    font-size: 34px;
  }
}
</style>

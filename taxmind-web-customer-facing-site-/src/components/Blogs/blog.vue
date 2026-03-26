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
    <v-layout wrap justify-start pt-16>
      <v-flex xs12 pt-3>
        <v-layout wrap justify-center>
          <v-flex xs12 pt-16>
            <v-img src="./../../assets/aboutustopimg.png" contain>
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 lg11 text-left align-self-center>
                      <span
                        style="
                          font-family: FajallaOne;
                          font-weight: 400;
                          font-size: 45px;
                          text-transform: uppercase;
                          color: white;
                        "
                        >Blogs</span
                      >
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-img>
          </v-flex>
        </v-layout>
        <v-layout wrap justify-center pt-16 pb-16>
          <v-flex xs12 lg11>
            <v-layout wrap justify-center fill-height>
              <v-flex xs10 lg10 align-self-center>
                <v-card elevation="10">
                  <v-layout wrap justify-center>
                    <v-flex xs12 lg11 pa-5 pt-10 pb-10>
                      <v-layout wrap justify-center>
                        <v-flex xs12 text-left align-self-center>
                          <span
                            style="
                              font-family: DMSans;
                              font-weight: 700;
                              font-size: 32px;
                              text-transform: capitalize;
                              color: #000000;
                            "
                            >{{ initialblog.title }}</span
                          >
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center pt-3>
                        <v-flex xs12 text-left align-self-center>
                          <span
                            ><v-icon color="#1A73E9">mdi-calendar-month</v-icon
                            ><span
                              style="
                                font-family: RobotoRegular;
                                font-weight: 400;
                                font-size: 16px;
                                color: #777777;
                              "
                              >{{ formatDate(initialblog.updatedAt) }}</span
                            ></span
                          >
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center pt-6 v-if="initialblog">
                        <v-flex
                          xs12
                          text-left
                          align-self-center
                          v-if="initialblog.image"
                        >
                          <v-img
                            :src="getImageUrl(initialblog.image)"
                            contain
                          ></v-img>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center pt-3>
                        <v-flex xs12 text-left align-self-center>
                          <span
                            style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                              color: #000000;
                            "
                            v-html="initialblog.content"
                          ></span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        <v-layout wrap justify-center pb-16>
          <v-flex xs11 lg11 sm11>
            <v-layout wrap justify-center>
              <v-flex xs11 lg10 sm10>
                <v-layout wrap justify-center>
                  <v-flex
                    xs12
                    lg6
                    sm6
                    pa-2
                    v-for="(blog, index) in displayedBlogs"
                    :key="index"
                    @click="swapBlog(blog)"
                    style="cursor: pointer"
                  >
                    <v-card elevation="0" style="background-color: #f7f9ff">
                      <v-layout wrap justify-center>
                        <v-flex xs12 v-if="blog.image">
                          <v-img :src="getImageUrl(blog.image)" contain>
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
                              font-size: 25px;
                            "
                          >
                            {{ trimText(blog.title, 40) }}
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
                                blog.excerpt || 'No excerpt available',
                                48
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
        <v-layout wrap justify-center pb-16 v-if="hasMoreBlogs">
          <v-flex xs12 text-center>
            <v-btn rounded color="#1A73E9" @click="loadMoreBlogs">
              <span
                style="
                  font-family: DMSans;
                  font-weight: 600;
                  font-size: 16px;
                  color: white;
                "
              >
                View More
              </span>
            </v-btn>
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
      appLoading: false,
      ServerError: false,
      // Global snackbar used via this.$snackbar
      blogs: [],
      initialblog: {},
      otherBlogs: [],
      displayedBlogs: [],
      currentPage: 1,
      blogsPerPage: 2,
    };
  },
  beforeMount() {
    this.getData();
  },
  computed: {
    hasMoreBlogs() {
      // Check if there are more blogs to load
      return this.blogs.length > this.currentPage * this.blogsPerPage + 1;
    },
  },
  methods: {
    trimText(text, length) {
      return text.length > length ? text.substring(0, length) + "..." : text;
    },
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/blogs", {
          params: {
            status: "published",
          },
        });
        this.appLoading = false;
        this.blogs = response.data;
        if (this.blogs.length > 0) {
          this.initialblog = this.blogs[0]; // First blog at the top
          this.updateDisplayedBlogs();
        }
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
                this.$snackbar.showError(err.response?.data?.message || "");
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
    updateDisplayedBlogs() {
      // Get blogs for current page, excluding the main blog
      const startIndex = 1; // Start from index 1 since index 0 is the main blog
      const endIndex = this.currentPage * this.blogsPerPage + 1;
      this.displayedBlogs = this.blogs.slice(startIndex, endIndex);
    },
    loadMoreBlogs() {
      this.currentPage++;
      this.updateDisplayedBlogs();
    },
    swapBlog(selectedBlog) {
      // Store the current main blog
      const currentMainBlog = this.initialblog;

      // Update the main blog with the selected one
      this.initialblog = selectedBlog;

      // Remove the selected blog from displayedBlogs
      this.displayedBlogs = this.displayedBlogs.filter(
        (blog) => blog !== selectedBlog
      );

      // Add the previous main blog to displayedBlogs
      this.displayedBlogs.unshift(currentMainBlog);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    getImageUrl(image) {
      if (!image) return "";
      if (image.filePath) return image.filePath;
      if (image.key) return this.mediaURL + image.key;
      if (typeof image === "string") return this.mediaURL + image;
      return "";
    },
    trimText(text, length) {
      if (!text) return "No content available";
      return text.length > length ? text.substring(0, length) + "..." : text;
    },
  },
};
</script>

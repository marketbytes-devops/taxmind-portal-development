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
        <v-layout wrap justify-center pt-6 pt-sm-0>
          <v-flex xs12>
            <v-img src="./../../assets/images/blogtopimage.webp" contain>
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 lg11 text-left align-self-center>
                      <span class="blog-title">Blog</span>
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
              <v-flex xs10 lg10 align-self-center class="card-container">
                <v-card elevation="10">
                  <v-layout wrap justify-center>
                    <v-flex xs12 lg11 pa-5 pt-10 pb-10>
                      <v-layout wrap justify-center>
                        <v-flex xs12 text-left align-self-center>
                          <span class="Blogmain">{{ blog.title }}</span>
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
                              >{{ formatDate(blog.updatedAt) }}</span
                            ></span
                          >
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center pt-6 v-if="blog">
                        <v-flex
                          xs12
                          text-left
                          align-self-center
                          v-if="blog.image"
                        >
                          <v-img :src="getImageUrl(blog.image)" contain></v-img>
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
                            v-html="blog.content"
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
      blog: {},
    };
  },
  metaInfo() {
    return {
      title: this.blog.title || "TaxMind Blog",
      meta: [
        {
          name: "description",
          content: this.blog.content
            ? this.blog.content.replace(/<[^>]*>?/gm, "").substring(0, 160) +
              "..."
            : "Read our latest blog on tax updates and financial insights.",
        },
        {
          name: "keywords",
          content: this.blog.title
            ? `${this.blog.title}, tax updates, finance, accounting`
            : "tax, finance, accounting, blog",
        },
        {
          property: "og:title",
          content: this.blog.title || "TaxMind Blog",
        },
        {
          property: "og:description",
          content: this.blog.content
            ? this.blog.content.replace(/<[^>]*>?/gm, "").substring(0, 200) +
              "..."
            : "Explore our latest blog post on tax and finance.",
        },
        {
          property: "og:image",
          content: this.blog.image
            ? this.mediaURL + this.blog.image
            : "https://your-default-image-url.com/default.jpg",
        },
        {
          property: "og:url",
          content: `https://www.taxmind.ie/blogs/${this.$route.params.slug}`,
        },
        {
          property: "og:type",
          content: "article",
        },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  beforeMount() {
    this.getData();
  },
  methods: {
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData(
          `/blogs/${this.$route.params.slug}`
        );
        this.appLoading = false;
        this.blog = response.data;
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
.card-container {
  position: relative;
  margin-top: -200px;
  z-index: 1;
}
@media (max-width: 1200px) {
  .card-container {
    position: relative;
    margin-top: -160px;
    z-index: 1;
  }
}
@media (max-width: 800px) {
  .card-container {
    position: relative;
    margin-top: -130px;
    z-index: 1;
  }
}
@media (max-width: 600px) {
  .card-container {
    position: relative;
    margin-top: -80px;
    z-index: 1;
  }
}
</style>
<style scoped>
.Blogmain {
  font-family: DMSans;
  font-weight: 700;
  font-size: 32px;
  text-transform: capitalize;
  color: #000000;
}
@media (max-width: 600px) {
  .Blogmain {
    font-family: DMSans;
    font-weight: 700;
    font-size: 25px;
    text-transform: capitalize;
    color: #000000;
  }
}
</style>

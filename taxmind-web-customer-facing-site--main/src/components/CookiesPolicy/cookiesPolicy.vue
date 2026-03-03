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
              src="./../../assets/images/aboutustop.webp"
              contain
              alt="aboutustop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">Cookies Policy !</span>
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
              src="./../../assets/images/aboutustopsmall.webp"
              contain
              alt="aboutustop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">Cookies Policy !</span>
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
        <v-layout wrap justify-center fill-height>
          <v-flex xs11>
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-layout wrap justify-center>
                  <v-flex xs11 sm11 px-1>
                    <v-layout
                      wrap
                      justify-space-around
                      py-lg-15
                      py-md-15
                      py-sm-4
                      py-4
                    >
                      <v-flex xs12 sm12 md8 text-start>
                        <v-layout
                          wrap
                          justify-center
                          pr-xs-0
                          pr-sm-0
                          pr-md-10
                          pr-lg-10
                          pr-xl-10
                        >
                          <v-flex
                            xs12
                            sm12
                            text-left
                            align-self-center
                            data-aos="zoom-in-up"
                            data-aos-ease="ease"
                            data-aos-duration="1500"
                            data-aos-delay="500"
                          >
                            <span
                              style="
                                color: black;
                                font-family: DMSans;
                                font-weight: 400;
                                font-size: 18px;
                                line-height: 25px;
                                letter-spacing: 1px;
                                text-align: justify;
                              "
                              v-html="about.content"
                            ></span>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                      <v-flex
                        xs12
                        sm12
                        md4
                        text-right
                        data-aos="flip-left"
                        data-aos-ease="ease"
                        data-aos-duration="1500"
                        data-aos-delay="500"
                        pb-lg-0
                        pb-md-0
                        pb-sm-6
                        pb-6
                        pt-0
                        pt-xl-16
                        pt-lg-16
                        pt-md-16
                        pt-sm-0
                      >
                        <v-img
                          src="./../../assets/images/aboutussideimage.webp"
                          alt="aboutussideimage"
                        >
                          <template v-slot:placeholder>
                            <ImageLoader />
                          </template>
                        </v-img>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout> </v-flex
            ></v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>  
    <script>
import { ApiMigrationMixin } from "../../utils/apiMigration";
export default {
  mixins: [ApiMigrationMixin],
  metaInfo: {
    title: "TaxMind Cookies Policy - How We Use Cookies",
    meta: [
      {
        name: "description",
        content:
          "Read TaxMind's Cookies Policy to learn how we use cookies to enhance your browsing experience, improve website functionality, and ensure data security.",
      },
      {
        name: "keywords",
        content:
          "TaxMind cookies policy, website cookies, data tracking, cookie usage, privacy settings, online security, user preferences, cookie consent",
      },
      {
        property: "og:title",
        content: "TaxMind Cookies Policy - Your Privacy & Preferences",
      },
      {
        property: "og:description",
        content:
          "Understand how TaxMind uses cookies to personalize your experience, analyze website traffic, and ensure a secure browsing environment.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/cookies-policy", // Replace with the actual Cookies Policy page URL
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
      about: {},
    };
  },
  beforeMount() {
    this.getData();
  },
  methods: {
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/site-contents/policies", {
          params: {
            type: "COOKIES_POLICY",
          },
        });
        this.appLoading = false;

        // Normalize various possible response shapes. The API may return:
        // - an array of policies
        // - an object with `data` property containing an array
        // - a single policy object
        let items = [];
        if (Array.isArray(response)) items = response;
        else if (response && Array.isArray(response.data))
          items = response.data;
        else if (response && response.data && Array.isArray(response.data.data))
          items = response.data.data;
        else if (
          response &&
          response.data &&
          typeof response.data === "object" &&
          !Array.isArray(response.data)
        )
          items = [response.data];
        else if (response && typeof response === "object" && response.type)
          items = [response];

        // Find cookies policy (case-insensitive match)
        const cookiePolicy = items.find((it) => {
          if (!it || !it.type) return false;
          const t = String(it.type).toLowerCase();
          return t === "cookies_policy" || t.includes("cookie");
        });

        // If no specific cookies policy found, prefer first item or empty object
        this.about =
          cookiePolicy || (items.length ? items[0] : { content: "" });
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
    font-size: 30px;
  }
}
</style>

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
              src="./../../assets/images/aboutustop.webp"
              contain
              alt="aboutustop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">Terms & Conditions !</span>
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
                      <span class="blog-title">Terms & Conditions !</span>
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
    title: "TaxMind Terms & Conditions - Your Agreement with Us",
    meta: [
      {
        name: "description",
        content:
          "Read TaxMind's Terms & Conditions to understand the rules, policies, and legal agreements that govern the use of our tax and financial services.",
      },
      {
        name: "keywords",
        content:
          "TaxMind terms and conditions, service agreement, user policy, legal terms, tax service terms, financial service policies, website terms",
      },
      {
        property: "og:title",
        content:
          "TaxMind Terms & Conditions - Know Your Rights & Responsibilities",
      },
      {
        property: "og:description",
        content:
          "Review TaxMind's Terms & Conditions to learn about your rights and obligations when using our tax and financial services.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/terms-and-conditions", // Replace with the actual Terms & Conditions page URL
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
            type: "TERMS_CONDITIONS",
          },
        });
        this.appLoading = false;
        // API may return an array of policies. Normalize and pick the one
        // where type === 'terms_and_condition' (case-insensitive).
        let items = [];
        if (Array.isArray(response)) {
          items = response;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        } else if (Array.isArray(response.data && response.data.data)) {
          items = response.data.data;
        }

        // If response is a single object, handle that too
        if (!items.length && response && typeof response === "object") {
          // try a few likely places
          if (response.data && !Array.isArray(response.data)) {
            this.about = response.data;
            return;
          }
          this.about = response;
          return;
        }

        const found = (items || []).find((it) => {
          if (!it || !it.type) return false;
          const t = String(it.type).toLowerCase();
          return (
            t === "terms_and_condition" ||
            t === "terms_conditions" ||
            t.includes("terms")
          );
        });

        this.about = found || (items.length ? items[0] : {});
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 422) {
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
            this.ServerError = true;
            this.$snackbar.showError(
              "A server error occurred. Please try again later."
            );
          } else {
            this.ServerError = true;
            this.$snackbar.showError(
              "An unexpected error occurred. Please try again."
            );
          }
        } else {
          this.ServerError = true;
          this.$snackbar.showError(
            "An unexpected error occurred. Please try again."
          );
        }
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
    font-size: 25px;
  }
}
</style>

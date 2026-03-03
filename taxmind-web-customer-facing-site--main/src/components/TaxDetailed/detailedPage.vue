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
              src="./../../assets/images/taxcredittop.webp"
              contain
              alt="taxcredittop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">{{ taxdetails.name }}</span>
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
              src="./../../assets/images/taxcredittopsmall.webp"
              contain
              alt="taxcredittop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">{{ taxdetails.name }}</span>
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
                              v-html="taxdetails.details"
                            ></span>
                          </v-flex>
                          <v-flex
                            xs12
                            data-aos="zoom-in-up"
                            data-aos-ease="ease"
                            data-aos-duration="1500"
                            data-aos-delay="500"
                          >
                            <v-btn
                              color="#1A73E9"
                              rounded
                              @click="redirectToPage"
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
                          src="./../../assets/images/taxdetailsimg.webp"
                          alt="taxdetails"
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
  data() {
    return {
      appLoading: false,
      ServerError: false,
      // Global snackbar used via this.$snackbar
      taxdetails: {},
      id: this.$route.params.id,
    };
  },
  metaInfo() {
    return {
      title: this.taxdetails.name
        ? `${this.taxdetails.name} - Tax Credit`
        : "Tax Credit Details",
      meta: [
        {
          name: "description",
          content: this.taxdetails.description || "Explore tax credit details.",
        },
        {
          name: "keywords",
          content: `${
            this.taxdetails.name || ""
          }, Tax Credit, Benefits, Eligibility`,
        },
        {
          property: "og:title",
          content: this.taxdetails.name || "Tax Credit Details",
        },
        {
          property: "og:description",
          content:
            this.taxdetails.description || "Learn about tax credit benefits.",
        },
        {
          property: "og:url",
          content: `https://www.taxmind.ie/tax-details/${this.$route.params.id}`,
        },
        {
          property: "og:type",
          content: "website",
        },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  beforeMount() {
    this.getData();
  },
  methods: {
    redirectToPage() {
      this.$router.push("/apply-now");
    },
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData(
          `/site-contents/tax-credits/${this.$route.params.id}`
        );
        this.appLoading = false;
        this.taxdetails = response.data;
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 500) {
            // Handle server error
            this.ServerError = true;
            this.$snackbar.showError(
              "A server error occurred. Please try again later."
            );
          } else {
            // Handle other errors (e.g., 422 validation error)
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
  },
};
</script>
<style scoped>
.tax-details-name {
  font-size: 45px; /* Default font size */
}

@media (max-width: 600px) {
  .tax-details-name {
    font-size: 10px; /* Reduced font size for mobile screens */
  }
}
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

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
                      <span class="blog-title">Fee Structure</span>
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
                      <span class="blog-title">Fee Structure</span>
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
    title: "TaxMind Fees Structure - Transparent Pricing & Services",
    meta: [
      {
        name: "description",
        content:
          "Explore TaxMind's transparent fees structure for tax and financial services. Understand our pricing for tax filing, financial planning, and business consultancy.",
      },
      {
        name: "keywords",
        content:
          "TaxMind fees structure, tax service pricing, financial planning fees, business consultancy cost, tax filing charges, transparent pricing, tax consultation fees",
      },
      {
        property: "og:title",
        content: "TaxMind Fees Structure - Affordable & Transparent Pricing",
      },
      {
        property: "og:description",
        content:
          "Check out TaxMind's pricing details for tax services, financial planning, and business advisory. We offer competitive and transparent fees with no hidden costs.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/fee-structure", // Replace with the actual Fees Structure page URL
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
            type: "FEE_STRUCTURE",
          },
        });
        this.appLoading = false;

        // Normalize response shapes (array, {data: []}, single object)
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

        // Prefer active fee_structure; otherwise match by type
        const feeCandidates = items.filter(
          (it) => it && it.type && String(it.type).toLowerCase().includes("fee")
        );
        let feePolicy =
          feeCandidates.find((it) => it.isActive) ||
          feeCandidates[0] ||
          (items.length ? items[0] : null);

        this.about = feePolicy || { content: "" };
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

<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <!-- Global snackbar mounted in App.vue; use this.$snackbar.showSuccess()/showError() -->
    <v-layout wrap justify-center pt-1 pt-sm-6 pt-md-16>
      <v-flex xs12 pt-3 pt-sm-3 pt-md-3>
        <v-layout wrap justify-center pt-3 pt-sm-0 pt-md-0 class="hidden-sm-and-down">
          <v-flex xs12 pt-16>
            <v-img src="./../../assets/images/aboutustop.webp" contain alt="aboutustop">
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">Privacy Policy !</span>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-img>
          </v-flex>
        </v-layout>
        <v-layout wrap justify-center pt-5 pt-sm-0 pt-md-0 class="hidden-md-and-up">
          <v-flex xs12 pt-16>
            <v-img src="./../../assets/images/aboutustopsmall.webp" contain alt="aboutustop">
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">Privacy Policy !</span>
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
                    <v-layout wrap justify-space-around py-lg-15 py-md-15 py-sm-4 py-4>
                      <v-flex xs12 sm12 md8 text-start>
                        <v-layout wrap justify-center pr-xs-0 pr-sm-0 pr-md-10 pr-lg-10 pr-xl-10>
                          <v-flex xs12 sm12 text-left align-self-center data-aos="zoom-in-up" data-aos-ease="ease"
                            data-aos-duration="1500" data-aos-delay="500">
                            <span style="
                                color: black;
                                font-family: DMSans;
                                font-weight: 400;
                                font-size: 18px;
                                line-height: 25px;
                                letter-spacing: 1px;
                                text-align: justify;
                              " v-html="about.content"></span>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                      <v-flex xs12 sm12 md4 text-right data-aos="flip-left" data-aos-ease="ease"
                        data-aos-duration="1500" data-aos-delay="500" pb-lg-0 pb-md-0 pb-sm-6 pb-6 pt-0 pt-xl-16
                        pt-lg-16 pt-md-16 pt-sm-0>
                        <v-img src="./../../assets/images/aboutussideimage.webp" alt="aboutussideimage">
                          <template v-slot:placeholder>
                            <ImageLoader />
                          </template>
                        </v-img>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout> </v-flex></v-layout>
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
    title: "TaxMind Privacy Policy - Your Data, Your Rights",
    meta: [
      {
        name: "description",
        content:
          "Read TaxMind's Privacy Policy to understand how we collect, use, and protect your personal data while ensuring compliance with data protection laws.",
      },
      {
        name: "keywords",
        content:
          "TaxMind privacy policy, data protection, personal data security, GDPR compliance, information security, privacy rights, user data protection",
      },
      {
        property: "og:title",
        content: "TaxMind Privacy Policy - Protecting Your Information",
      },
      {
        property: "og:description",
        content:
          "Learn how TaxMind safeguards your personal data, ensures compliance with privacy regulations, and maintains the security of your information.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/privacy-policy", // Replace with the actual Privacy Policy page URL
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
  mounted() {
    // Debug: Log the about object after component mounts
    console.log("Privacy Policy component mounted, about object:", this.about);
  },
  methods: {
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData(
          "/site-contents/policies/active?type=privacy_policy"
        );
        this.appLoading = false;

        console.log("Privacy Policy API Response:", response);

        if (response.data) {
          this.about = response.data;
          console.log("Active privacy policy loaded:", this.about);
        } else {
          console.warn("No privacy policy found in response");
          this.about = {
            content: "Privacy policy not available at the moment.",
          };
        }
      } catch (error) {
        // Error handling done automatically by ApiMigrationMixin
        console.error("Failed to load privacy policy:", error);
        this.about = {
          content: "Unable to load privacy policy. Please try again later.",
        };
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
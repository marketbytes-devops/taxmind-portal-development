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
                      <span class="blog-title">About Us !</span>
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
                      <span class="blog-title">About Us !</span>
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
    title: "About TaxMind - Your Trusted Tax & Finance Partner",
    meta: [
      {
        name: "description",
        content:
          "Learn about TaxMind, a trusted tax and finance partner. Our expert team provides tax filing, financial planning, and business advisory services.",
      },
      {
        name: "keywords",
        content:
          "about TaxMind, tax experts, financial advisors, tax consultancy, business finance, tax planning, financial services, TaxMind team",
      },
      {
        property: "og:title",
        content: "About TaxMind - Expertise in Tax & Finance",
      },
      {
        property: "og:description",
        content:
          "Discover TaxMind’s mission, expertise, and commitment to simplifying tax and financial matters for individuals and businesses.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/about-us", // Replace with the actual About Us page URL
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
        const response = await this.fetchData("/site-contents/config");
        this.appLoading = false;

        // Use aboutUsContent from TAXMIND.json response structure
        this.about = {
          content:
            response.data.aboutUsContent ||
            response.data.aboutUs ||
            response.data.content ||
            response.data,
        };
      } catch (err) {
        this.appLoading = false;
        this.ServerError = true;
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

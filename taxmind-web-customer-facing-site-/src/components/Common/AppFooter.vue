<template>
  <div>
    <v-footer padless light color="#1252A5">
      <v-layout wrap justify-center pt-4 pb-10 class="footer">
        <v-flex xs11 sm11 px-2 text-center>
          <v-layout wrap justify-start>
            <v-flex
              xs12
              sm4
              md4
              lg4
              xl4
              text-left
              align-self-center
              style="line-height: 16px"
            >
              <router-link to="/">
                <v-layout wrap justify-start pb-2>
                  <v-flex xs12 sm10 md8 lg5 xl3 text-left align-self-start>
                    <v-img
                      src="./../../assets/footerlogo.webp"
                      contain
                      height="50px"
                      alt="footerlogo"
                    ></v-img>
                  </v-flex>
                </v-layout>
                <v-layout wrap>
                  <v-flex xs12 xl12 text-justify class="footer">
                    <span
                      style="
                        font-family: DMSans;
                        font-weight: 400;
                        font-size: 16px;
                        line-height: 27px;
                        color: #ffffff;
                        text-transform: capitalize;
                      "
                    >
                      At TaxMind, we specialize in making tax claims simple,
                      efficient, and stress-free. Our expert team works
                      diligently to ensure you receive every refund you’re
                      entitled to. With a focus on accuracy and transparency, we
                      make the entire process seamless and hassle-free.
                    </span>
                  </v-flex>
                </v-layout>
                <!-- TrustBox widget - Review Collector -->
              </router-link>
            </v-flex>
            <v-spacer></v-spacer>
            <v-flex xs12 sm7 md7 lg7 xl7 text-left align-self-center>
              <v-layout wrap justify-start>
                <v-flex xs6 lg4 md4 sm6 xl4 pt-2>
                  <v-layout wrap justify-start>
                    <v-flex xs12 class="footerheader"> Navigation </v-flex>
                    <v-flex xs12 sm12 md12 align-self-center pt-2>
                      <router-link to="/">
                        <span class="footersubitems"> Home </span>
                      </router-link>
                    </v-flex>
                    <!-- <v-flex xs12 sm12 md12 pt-2 align-self-center>
                      <router-link to="/">
                        <span class="footersubitems"> Tax Credits </span>
                      </router-link>
                    </v-flex> -->
                    <v-flex xs12 sm12 md12 pt-2 align-self-center>
                      <router-link to="/contact-us">
                        <span class="footersubitems"> Contact Us </span>
                      </router-link>
                    </v-flex>
                    <v-flex xs12 sm12 md12 pt-2 align-self-center>
                      <router-link to="/login" v-if="!appLogin">
                        <span class="footersubitems"> Login </span>
                      </router-link>
                    </v-flex>
                  </v-layout>
                  <CustomTrustpilot />
                </v-flex>
                <v-flex xs6 lg4 md4 sm6 xl4 pt-2>
                  <v-layout wrap justify-start>
                    <v-flex xs12 class="footerheader"> Quick Links </v-flex>
                    <v-flex xs12 sm12 md12 align-self-center pt-2>
                      <router-link to="/privacy-policy">
                        <span class="footersubitems"> Privacy Policy </span>
                      </router-link>
                    </v-flex>
                    <v-flex xs12 sm12 md12 pt-2 align-self-center>
                      <router-link to="/cookies-policy">
                        <span class="footersubitems"> Cookies Policy </span>
                      </router-link>
                    </v-flex>
                    <v-flex xs12 sm12 md12 pt-2 align-self-center>
                      <router-link to="/fee-structure">
                        <span class="footersubitems"> Fee Structure </span>
                      </router-link>
                    </v-flex>
                    <v-flex xs12 sm12 md12 pt-2 align-self-center>
                      <router-link to="/terms-and-conditions">
                        <span class="footersubitems">Terms & Conditions</span>
                      </router-link>
                    </v-flex>
                  </v-layout>
                </v-flex>
                <v-flex xs12 lg4 md4 sm6 xl4 pt-2>
                  <v-layout wrap justify-start>
                    <v-flex xs12 class="footerheader"> Get in Touch </v-flex>
                    <v-flex xs12>
                      <v-layout wrap justify-start>
                        <v-flex
                          xs1
                          sm3
                          md2
                          lg1
                          xl1
                          v-for="(item, i) in headerIcons"
                          :key="i"
                          pt-2
                        >
                          <v-img
                            :src="mediaURL + item.icon"
                            height="18px"
                            width="18px"
                            @click="openUrl(item.url)"
                            style="cursor: pointer"
                          ></v-img>
                        </v-flex>
                        <v-flex xs12 pt-2 xl12>
                          <span>CRO - 77606</span><br />
                          <span>VAT NO - 4356944KH</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
      <v-layout
        wrap
        justify-center
        py-2
        style="background-color: #043a82"
        class="hidden-sm-and-down"
      >
        <v-flex xs12 sm11 px-2>
          <v-layout wrap justify-start py-5>
            <v-flex xs12 sm12 md6 lg6 text-left style="color: #ffffff">
              <v-layout wrap justify-center>
                <v-flex xs12>
                  <span
                    style="
                      font-family: DMSans;
                      font-size: 15px;
                      font-weight: 400;
                      color: #ffffff;
                    "
                  >
                    Tax Mind Limited © 2025. All rights reserved.
                  </span>
                </v-flex>
              </v-layout>
            </v-flex>
            <!-- <v-flex xs12 sm12 md6 lg6 style="color: #ffffff">
              <v-layout wrap justify-center>
                <v-flex xs12 text-right>
                  <span
                    style="
                      font-family: DMSans;
                      font-weight: 400;
                      font-size: 15px;
                    "
                    >Designed & Developed by
                    <span
                      style="
                        font-family: DMSans;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                      "
                      @click="redirectToLeopardTechLabs"
                      >Leopard Tech Labs Pvt Ltd</span
                    ></span
                  >
                </v-flex>
              </v-layout>
            </v-flex> -->
          </v-layout>
        </v-flex>
      </v-layout>
      <v-layout
        wrap
        justify-center
        py-2
        style="background-color: #043a82"
        class="hidden-md-and-up"
      >
        <v-flex xs12 sm12 md11 px-2>
          <v-layout wrap justify-start py-5>
            <v-flex xs12 sm6 md6 lg6 text-start style="color: #ffffff">
              <v-layout wrap justify-start>
                <v-flex xs12>
                  <span
                    style="
                      font-family: DMSans;
                      font-size: 15px;
                      font-weight: 400;
                      color: #ffffff;
                    "
                  >
                    Tax Mind Limited © 2025. All rights reserved.
                  </span>
                </v-flex>
              </v-layout>
            </v-flex>
            <!-- <v-flex xs12 sm6 md6 lg6 style="color: #ffffff">
              <v-layout wrap justify-center>
                <v-flex xs12 text-center>
                  <span
                    style="
                      font-family: DMSans;
                      font-weight: 400;
                      font-size: 15px;
                    "
                    >Designed & Developed by
                    <span
                      style="
                        font-family: DMSans;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                      "
                      @click="redirectToLeopardTechLabs"
                      >Leopard Tech Labs Pvt Ltd</span
                    ></span
                  >
                </v-flex>
              </v-layout>
            </v-flex> -->
          </v-layout>
        </v-flex>
      </v-layout>
    </v-footer>
  </div>
</template>
<script>
import axios from "axios";
import CustomTrustpilot from "./CustomTrustpilot.vue";

export default {
  components: {
    CustomTrustpilot,
  },
  data() {
    return {
      items: [
        { icon: require("./../../assets/icons/kIn.png") },
        { icon: require("./../../assets/icons/kX.png") },
        { icon: require("./../../assets/icons/kFb.png") },
      ],
      headerIcons: [],
    };
  },
  mounted() {
    this.getData();
  },
  computed: {
    appLogin() {
      return this.$store.state.isLoggedIn;
    },
  },
  methods: {
    getData() {
      this.appLoading = true;
      axios({
        url: "/site-contents/social-media",
        method: "GET",
      })
        .then((response) => {
          this.appLoading = false;
          this.headerIcons = response.data.data;
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response?.data?.message || "";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
        });
    },
    openUrl(url) {
      window.open(url, "_blank");
    },
    redirectToLeopardTechLabs() {
      window.open("https://leopardtechlabs.com/", "_blank");
    },
  },
};
</script>
<style>
.footer {
  position: relative;
  z-index: 2;
  /* Ensure footer content is above the overlay */
  color: #ffffff;
  /* Set white color for text */
}

.footerItems {
  font-size: 15px;
  /* Example size, adjust as needed */
  font-family: "RobotoRegular", sans-serif;
  color: #ffffff;
  /* Ensure text is white */
  letter-spacing: 0.5px;
  /* Optional for better readability */
}

.trustpilot-widget {
  display: block;
}

.v-divider {
  background-color: #ffffff;
  /* Divider should also match the text color */
}

.footerheader {
  font-family: DMSans;
  font-weight: 700;
  font-size: 20px;
}

.tp-widget-wrapper {
  text-align: left !important;
}

.footersubitems {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
  color: #ffffff;
}
</style>

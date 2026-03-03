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
              src="./../../assets/images/contactustopimage.webp"
              contain
              alt="contactustop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">Contact Us !</span>
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
              src="./../../assets/images/contactustopimagesmall.webp"
              contain
              alt="contactustop"
            >
              <v-layout wrap justify-center fill-height>
                <v-flex xs10 lg10 align-self-center>
                  <v-layout wrap justify-center>
                    <v-flex xs12 text-left align-self-center>
                      <span class="blog-title">Contact Us !</span>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-img>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center>
      <v-flex xs12>
        <v-layout wrap justify-center>
          <v-flex xs11 sm12 md10 lg10 pb-10>
            <v-layout wrap justify-center>
              <v-layout wrap justify-center pt-10>
                <v-flex
                  xs11
                  sm10
                  md6
                  lg7
                  text-left
                  data-aos="zoom-in-right"
                  data-aos-ease="ease"
                  data-aos-duration="1500"
                  data-aos-delay="500"
                >
                  <v-flex>
                    <h2
                      style="
                        color: black;
                        font-family: FajallaOne;
                        font-weight: 400;
                        font-size: 30px;
                      "
                    >
                      Get in
                      <span
                        style="
                          font-weight: 400;
                          color: #1a73e9;
                          font-family: FajallaOne;
                          font-size: 30px;
                        "
                        >Touch</span
                      >
                    </h2>
                  </v-flex>
                  <v-flex
                    xs12
                    sm12
                    md10
                    lg8
                    pt-3
                    style="
                      color: black;
                      font-family: DMSans;
                      font-weight: 400;
                      font-size: 18px;
                      color: #000000bd;
                    "
                  >
                    <p>
                      If you have any questions or concerns regarding TaxMind,
                      please contact us:
                    </p>
                  </v-flex>
                  <!-- First Image and Text Pair -->
                  <!-- <v-layout row pt-4>
                    <v-flex shrink>
                      <v-img
                        height="30px"
                        width="30px"
                        src="./../../assets/images/contact1.png"
                      ></v-img>
                    </v-flex>
                    <v-flex>
                      <span
                        style="
                          margin-left: 8px;
                          font-size: 16px;
                          font-family: opensansregular;
                          font-weight: 700;
                          color: black;
                        "
                        >Address</span
                      >
                      <br />
                      <span
                        style="
                          margin-left: 8px;
                          font-family: opensansregular;
                          font-weight: 400;
                          color: black;
                          font-size: 15px;
                        "
                        >TaxMind Office</span
                      >
                      <br />
                      <span
                        style="
                          margin-left: 8px;
                          font-family: opensansregular;
                          font-weight: 400;
                          color: black;
                          font-size: 15px;
                        "
                        >123 Finance Tower,</span
                      >
                      <br />
                      <span
                        style="
                          margin-left: 8px;
                          font-family: opensansregular;
                          font-weight: 400;
                          color: black;
                          font-size: 15px;
                        "
                        >Dublin, Ireland, D02 XYZ</span
                      >
                    </v-flex>
                  </v-layout> -->

                  <!-- Second Image and Text Pair -->
                  <v-layout row pt-6>
                    <v-flex shrink>
                      <v-img
                        height="30px"
                        width="30px"
                        alt="contact2"
                        src="./../../assets/images/contact2.png"
                      ></v-img>
                    </v-flex>
                    <v-flex>
                      <span
                        style="
                          margin-left: 8px;
                          font-size: 16px;
                          font-family: opensansregular;
                          font-weight: 700;
                          color: black;
                        "
                        >Phone Number</span
                      >
                      <br />
                      <span
                        style="
                          margin-left: 8px;
                          font-family: opensansregular;
                          font-weight: 400;
                          color: black;
                          font-size: 15px;
                        "
                        >{{ headerData.phone }}</span
                      >
                      <br />
                    </v-flex>
                  </v-layout>

                  <!-- Third Image and Text Pair -->
                  <v-layout row pt-6>
                    <v-flex shrink>
                      <v-img
                        height="30px"
                        width="30px"
                        alt="contact3"
                        src="./../../assets/images/contact3.png"
                      ></v-img>
                    </v-flex>
                    <v-flex>
                      <span
                        style="
                          margin-left: 8px;
                          font-size: 16px;
                          font-family: opensansregular;
                          font-weight: 700;
                          color: black;
                        "
                        >E-mail</span
                      >
                      <br />
                      <a
                        :href="'mailto:' + headerData.email"
                        style="
                          margin-left: 8px;
                          font-family: opensansregular;
                          font-weight: 400;
                          color: black;
                          font-size: 15px;
                          text-decoration: none;
                          cursor: pointer;
                        "
                        >{{ headerData.email }}</a
                      >
                      <br />
                    </v-flex>
                  </v-layout>
                </v-flex>
                <!-- Right Side with Form -->
                <v-flex
                  xs11
                  sm10
                  pt-5
                  pt-sm-5
                  pt-md-0
                  pt-lg-0
                  md6
                  lg5
                  pb-4
                  data-aos="flip-left"
                  data-aos-ease="ease"
                  data-aos-duration="1500"
                  data-aos-delay="500"
                >
                  <v-card flat rounded="lg" color="#FFFFFF">
                    <v-layout wrap justify-center>
                      <v-flex px-4 px-sm-8>
                        <v-layout wrap justify-center>
                          <v-flex xs12 sm12 py-2 pt-3 text-start>
                            <span
                              style="
                                color: black;
                                font-family: DMSans;
                                font-size: 30px;
                                font-weight: 700;
                              "
                            >
                              Send us a
                              <span
                                style="
                                  color: #1a73e9;
                                  font-family: DMSans;
                                  font-size: 30px;
                                  font-weight: 700;
                                "
                              >
                                Message
                              </span> </span
                            ><br />
                            <span
                              style="
                                font-family: DMSans;
                                font-size: 18px;
                                font-weight: 500;
                                color: #28272996;
                              "
                              >Please enter your queries</span
                            >
                          </v-flex>

                          <v-form @submit.prevent="verifyInput">
                            <v-flex
                              xs12
                              text-left
                              style="
                                color: black;
                                font-family: opensansregular;
                                font-size: 16px;
                              "
                            >
                              <v-layout wrap justify-center>
                                <v-flex xs12>
                                  <span class="textField">Name</span>
                                </v-flex>
                                <v-flex xs12>
                                  <v-text-field
                                    v-model="name"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details
                                    style="font-family: opensansregular"
                                  >
                                  </v-text-field>
                                </v-flex>
                                <v-flex xs12 pt-3>
                                  <span class="textField">Email</span>
                                </v-flex>
                                <v-flex xs12>
                                  <v-text-field
                                    v-model="email"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details
                                  >
                                  </v-text-field>
                                </v-flex>
                                <v-flex xs12 pt-3>
                                  <span class="textField">Category</span>
                                </v-flex>
                                <v-flex xs12>
                                  <v-select
                                    v-model="category"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    :items="categorieslist"
                                    item-text="name"
                                    item-value="id"
                                    outlined
                                    flat
                                    hide-details
                                    style="font-family: opensansregular"
                                  >
                                  </v-select>
                                </v-flex>
                                <v-flex xs12 pt-3>
                                  <span class="textField"> Message </span>
                                </v-flex>
                                <v-flex xs12>
                                  <v-textarea
                                    v-model="message"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details
                                  >
                                  </v-textarea>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                            <v-flex xs12 pb-3 pt-10 text-end>
                              <v-btn
                                @click="verifyInput"
                                color="#1A73E9"
                                dark
                                :ripple="false"
                                depressed
                                class="rounded-lg"
                              >
                                <span
                                  style="
                                    font-family: opensansregular;
                                    font-weight: 700px;
                                  "
                                >
                                  Submit
                                </span>
                              </v-btn>
                            </v-flex>
                          </v-form>
                        </v-layout>
                      </v-flex>
                    </v-layout>
                  </v-card>
                </v-flex>
              </v-layout>
            </v-layout>
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
    title: "Contact TaxMind - Get in Touch with Our Experts",
    meta: [
      {
        name: "description",
        content:
          "Need tax or financial assistance? Contact TaxMind today for expert advice on tax filing, financial planning, and business consultancy.",
      },
      {
        name: "keywords",
        content:
          "contact TaxMind, tax consultation, financial advice, tax support, business consultancy, tax help, financial planning, customer support",
      },
      {
        property: "og:title",
        content: "Contact TaxMind - We're Here to Help",
      },
      {
        property: "og:description",
        content:
          "Reach out to TaxMind for expert tax and finance guidance. Our team is ready to assist you with all your tax and financial queries.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/contact-us", // Replace with the actual Contact Us page URL
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
      email: null,
      name: null,
      message: null,
      category: null,
      categorieslist: [],
      headerData: {},
    };
  },
  // mounted() {
  //   this.getCategory();
  // },
  beforeMount() {
    this.getCategory();
    this.getData();
  },
  methods: {
    verifyInput() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const nameRegex = /^[A-Za-z\s]+$/;
      if (!this.name) {
        this.$snackbar.showError("Please Provide Name");
        return;
      }
      if (!nameRegex.test(this.name)) {
        this.$snackbar.showError("Name can only contain alphabets");
        return;
      }
      if (!this.email) {
        this.$snackbar.showError("Please Provide Email");
        return;
      }
      if (!emailRegex.test(this.email)) {
        this.$snackbar.showError("Please Provide a Valid Email.");
        return;
      }
      if (!this.message) {
        this.$snackbar.showError("Please Provide Message");
        return;
      }
      if (!this.category) {
        this.$snackbar.showError("Please Select Category");
        return;
      }
      this.login();
    },
    async login() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/users/queries", {
          method: "POST",
          data: {
            email: this.email,
            name: this.name,
            categoryId: this.category,
            message: this.message,
          },
        });
        this.appLoading = false;

        // Handle TAXMIND.json response structure
        if (response.success) {
          try {
            this.$snackbar.showSuccess(response?.message || "Message sent");
          } catch (e) {
            this.$snackbar.showSuccess(response.message || "Message sent");
          }
          // Clear form
          this.name = null;
          this.email = null;
          this.message = null;
          this.category = null;
        } else {
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              this.$snackbar.showApiError(
                response || { error: "Failed to submit query" }
              );
            } else {
              this.$snackbar.showError(
                response.message || "Failed to submit query"
              );
            }
          } catch (e) {
            this.$snackbar.showError(
              response.message || "Failed to submit query"
            );
          }
        }
      } catch (err) {
        this.appLoading = false;
        // Error handling automatically done by ApiMigrationMixin
        this.ServerError = true;
        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            this.$snackbar.showApiError(
              err || {
                error:
                  "An error occurred while submitting your query. Please try again.",
              }
            );
          } else {
            this.$snackbar.showError(
              "An error occurred while submitting your query. Please try again."
            );
          }
        } catch (e) {
          this.$snackbar.showError(
            "An error occurred while submitting your query. Please try again."
          );
        }
      }
    },
    async getCategory() {
      try {
        this.appLoading = true;
        const response = await this.fetchData(
          "/site-contents/query-categories"
        );
        this.appLoading = false;

        // Handle TAXMIND.json response structure
        if (response.success && response.data) {
          this.categorieslist = response.data;
        } else {
          console.warn("No categories found in response:", response);
          this.categorieslist = [];
        }
      } catch (err) {
        this.appLoading = false;
        // Error handling automatically done by ApiMigrationMixin
        this.ServerError = true;
        this.$snackbar.showError(
          "Failed to load contact categories. Please refresh the page."
        );
      }
    },
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/site-contents/config");
        this.appLoading = false;

        // Handle TAXMIND.json response structure
        if (response.success && response.data) {
          this.headerData = {
            email:
              response.data.headerEmail ||
              response.data.header?.email ||
              "info@taxmind.ie",
            phone:
              response.data.headerPhone ||
              response.data.header?.phone ||
              "+353 1 234 5678",
          };
        } else {
          // Fallback values
          this.headerData = {
            email: "info@taxmind.ie",
            phone: "+353 1 234 5678",
          };
        }
      } catch (err) {
        this.appLoading = false;
        // Error handling automatically done by ApiMigrationMixin
        // Set fallback values on error
        this.headerData = {
          email: "info@taxmind.ie",
          phone: "+353 1 234 5678",
        };
      }
    },
  },
};
</script>

<style scoped>
.form-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: white;
  color: black;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.form-title {
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
}

.submit-btn {
  margin-top: 20px;
  color: white;
  width: 100%;
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
    font-size: 30px;
  }
}
</style>

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
    <v-layout wrap justify-center pt-10 pb-10>
      <v-flex xs12 pa-6>
        <v-layout wrap justify-center>
          <v-flex xs12 lg11 md11 sm11>
            <v-layout wrap>
              <!-- Left Section: Expansion Panels -->
              <v-flex xs12 lg6 md6>
                <v-layout column>
                  <v-flex xs12 text-left>
                    <span
                      style="
                        font-family: FajallaOne;
                        font-weight: 400;
                        font-size: 30px;
                        line-height: 37.71px;
                      "
                    >
                      Got Questions? We’ve Got
                      <span style="color: #1a73e9">Answers!</span>
                    </span>
                  </v-flex>
                  <v-flex xs12 text-left pt-2>
                    <span
                      style="
                        font-family: DMSans;
                        font-weight: 400;
                        font-size: 18px;
                        line-height: 23.44px;
                      "
                    >
                      Explore our FAQs for quick and clear solutions to your
                      concerns.
                    </span>
                  </v-flex>
                  <v-flex xs12 lg12 pt-5>
                    <v-layout wrap justify-center>
                      <v-flex
                        xs12
                        text-left
                        v-for="(item, index) in faqlist"
                        :key="index"
                        data-aos="flip-right"
                        data-aos-ease="ease"
                        data-aos-duration="1500"
                        data-aos-delay="500"
                      >
                        <v-layout class="expansion-panel" column>
                          <v-flex>
                            <v-layout
                              @click="togglePanel(index)"
                              class="question"
                              align="center"
                            >
                              <v-flex xs>
                                <h3
                                  class="pa-3"
                                  :class="{ open: openIndex === index }"
                                >
                                  {{ item.question }}
                                </h3>
                              </v-flex>
                              <v-flex xs2 sm1 md1 lg1>
                                <span
                                  class="px-6"
                                  :class="{ open: openIndex === index }"
                                  style="font-size: 25px"
                                >
                                  {{ openIndex === index ? "_" : "+" }}
                                </span>
                              </v-flex>
                            </v-layout>
                          </v-flex>
                          <v-flex v-if="openIndex === index" class="answer">
                            <p
                              class="pa-2 px-3"
                              style="
                                font-family: opensansregular;
                                text-align: justify;
                              "
                            >
                              {{ item.answer }}
                            </p>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                  <v-flex xs12 pt-5>
                    <v-layout wrap justify-center>
                      <v-flex xs12 text-center>
                        <v-btn rounded dense color="#1A73E9" to="/faqs">
                          <span
                            style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 16px;
                              color: #ffffff;
                            "
                            >View More</span
                          >
                        </v-btn>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
              </v-flex>

              <!-- Right Section: Image -->
              <v-flex xs12 lg6 md6 class="d-flex justify-center align-center">
                <v-img
                  src="../../assets/images/faqimg.webp"
                  alt="faqimg"
                  contain
                  max-height="500px"
                  max-width="100%"
                ></v-img>
              </v-flex>
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
  data() {
    return {
      openIndex: null,
      ServerError: false,
      faqlist: [],
      // Global snackbar used via this.$snackbar
      appLoading: false,
      // page: 1,
      // currentPage: 1,
      // pages: 0,
      // limit: 6,
    };
  },
  watch: {
    currentPage() {
      this.getData();
    },
  },
  mounted() {
    this.getData();
  },
  methods: {
    togglePanel(index) {
      this.openIndex = this.openIndex === index ? null : index;
    },
    closeDialog() {
      this.adddialog = false;
      this.getData();
    },
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/site-contents/faqs", {
          params: {
            limit: 5,
            page: 1,
          },
        });
        this.appLoading = false;
        this.faqlist = response.data;
        //this.pages = Math.ceil(response.data.totalLength / this.limit);
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
        // Show error using global snackbar
        this.$snackbar.showError(this.msg || "An unexpected error occurred.");
      }
    },
    showFullDescription(desc) {
      this.fullDescription = desc;
      this.dialogdes = true;
    },
  },
};
</script>

<style scoped>
.expansion-panel {
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 15px;
  background-color: white;
}

.question {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  font-family: opensansregular;
  font-size: 15px;
}

.question h3 {
  margin: 0;
  font-size: 15px;
  color: #000;
  /* Default color for closed panels */
  transition: color 0.3s ease;
}

.question h3.open {
  color: #1a73e9;
  /* Orange color for open panels */
}

.question span {
  color: #000;
  /* Default color for closed panels */
  transition: color 0.3s ease;
}

.question span.open {
  color: #1a73e9;
  /* Orange color for open panels */
}

.dialog-card {
  font-family: interbold;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.dialog-icon {
  animation: pulse 1s infinite alternate;
}

.dialog-button {
  min-width: 120px;
}

@keyframes pulse {
  from {
    transform: scale(1);
    opacity: 0.7;
  }

  to {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>

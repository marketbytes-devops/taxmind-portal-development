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
    <v-layout wrap justify-center pt-10 pb-10 v-if="items && items.length > 0">
      <v-flex xs12 pa-6>
        <v-layout wrap justify-center>
          <v-flex xs12 lg11 md11 sm10>
            <v-layout wrap justify-center>
              <v-flex xs12 text-left>
                <span
                  style="
                    font-family: FajallaOne;
                    font-weight: 400;
                    font-size: 30px;
                    line-height: 37.71px;
                  "
                >
                  What Our <span style="color: #1a73e9">Clients</span> Say?
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
                  Real Experiences. Genuine Feedback.
                </span>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-start pt-5>
              <v-flex
                xs12
                sm6
                md4
                lg4
                pa-2
                v-for="(item, i) in displayedItems"
                :key="i"
              >
                <v-card rounded="lg" flat>
                  <v-layout wrap justify-center pa-5>
                    <v-flex xs12>
                      <v-layout wrap>
                        <v-flex xs3 sm2 md2>
                          <v-avatar color="#1A73E9">
                            <v-icon dark large> mdi-account-circle </v-icon>
                          </v-avatar>
                        </v-flex>
                        <v-flex xs9 sm10 md10 pl-2 align-self-center>
                          <v-layout wrap>
                            <v-flex xs12 text-left>
                              <span style="font-family: DMSans; color: #000000">
                                {{ item.userId.fullName }}
                              </span>
                            </v-flex>
                            <v-flex xs12 text-left>
                              <span
                                style="
                                  font-family: DMSans;
                                  color: #000000;
                                  font-size: 13px;
                                "
                                >{{ item.userId.profession }}</span
                              >
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                    <v-flex xs12 py-5>
                      <v-divider></v-divider>
                    </v-flex>
                    <v-flex xs12 text-left>
                      <span class="review-text">{{ item.review }}</span>
                    </v-flex>
                    <v-flex xs12 text-left>
                      <v-rating
                        v-model="item.rating"
                        color="warning lighten-1"
                        background-color="#1A73E9"
                        empty-icon="$ratingFull"
                        hover
                        small
                        readonly
                      ></v-rating>
                    </v-flex>
                  </v-layout>
                  <v-flex
                    xs12
                    style="
                      background-color: #043a82;
                      padding: 3px;
                      border-radius: 0 0 10px 10px;
                    "
                  >
                  </v-flex>
                </v-card>
              </v-flex>
              <v-flex xs12 text-right v-if="items && items.length > 3">
                <span
                  v-if="visibleItems < items.length"
                  @click="viewMore"
                  style="font-family: DMSans; color: #1a73e9; cursor: pointer"
                >
                  View More
                </span>
                <span
                  v-else
                  @click="viewLess"
                  style="font-family: DMSans; color: #1a73e9; cursor: pointer"
                >
                  View Less
                </span>
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
      appLoading: false,
      ServerError: false,
      // Global snackbar used via this.$snackbar
      visibleItems: 3,
      items: [],
    };
  },
  computed: {
    displayedItems() {
      return this.items.slice(0, this.visibleItems);
    },
  },
  mounted() {
    this.getData();
  },
  methods: {
    viewMore() {
      this.visibleItems += 3;
    },
    viewLess() {
      this.visibleItems = 3;
    },
    async getData() {
      try {
        const response = await this.fetchData("/applications/reviews", {
          params: {
            status: "approved",
            page: 1,
            size: 10,
          },
        });
        if (response.data.success) {
          this.items = response.data.data;
        } else {
          this.$snackbar.showError(
            response.data.message || "Failed to load reviews"
          );
        }
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
                this.$snackbar.showError(err.response?.data?.message || "");
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
        // Already shown via this.$snackbar
      }
    },
  },
};
</script>
<style scoped>
.review-text {
  font-family: DMSans;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5; /* number of lines to show */
  -webkit-box-orient: vertical;
  height: 100px; /* adjust height as needed */
}
</style>

<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="#1A73E9" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: #ffffff">
            {{ msg }}
          </span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon style="color: #ffffff">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <v-layout wrap justify-center>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Header Section -->
        <v-layout wrap justify-start align-center class="my-3">
          <v-flex shrink>
            <v-btn icon @click="goBackToUserList" class="mr-2">
              <v-icon color="#1A73E9">mdi-chevron-left</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs12 sm6 md8 lg8 text-start align-center pt-2 class="carousalhead">User Details
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12 sm12 md12 lg12>
                <v-card class="pa-8 pt-10" outlined color="white">
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Name</span>
                      <br />
                      <span v-if="userData.fullName">{{
                        userData.fullName
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Email</span>
                      <br />
                      <span v-if="userData.email">{{ userData.email }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Phone Number</span>
                      <br />
                      <span v-if="userData.phone">{{ userData.phone }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Date Of Birth</span>
                      <br />
                      <span v-if="userData.dob">{{
                        formattedDateOfBirth
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Profession</span>
                      <br />
                      <span v-if="userData.profession">{{
                        userData.profession
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">PPS Number</span>
                      <br />
                      <span v-if="userData.ppsNumber">{{
                        userData.ppsNumber
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Eircode</span>
                      <br />
                      <span v-if="userData.eircode">{{
                        userData.eircode
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Address</span>
                      <br />
                      <span v-if="userData.address">{{
                        userData.address
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Marital Status</span>
                      <br />
                      <span v-if="userData.maritalStatus">{{
                        formatMaritalStatus(userData.maritalStatus)
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4 v-if="

                    userData.spouse
                  ">
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Spouse Details</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Full Name</span>
                          <br />
                          <span v-if="spouseData.name">{{
                            spouseData.name
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Email</span>
                          <br />
                          <span v-if="spouseData.email">{{
                            spouseData.email
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Phone Number</span>
                          <br />
                          <span v-if="spouseData.phone">{{
                            spouseData.phone
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Date Of Birth</span>
                          <br />
                          <span v-if="spouseData.dob">{{
                            formattedSpouseDateOfBirth
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Profession</span>
                          <br />
                          <span v-if="spouseData.profession">{{
                            spouseData.profession
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">PPS Number</span>
                          <br />
                          <span v-if="spouseData.ppsNumber">{{
                            spouseData.ppsNumber
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Eircode</span>
                          <br />
                          <span v-if="spouseData.eircode">{{
                            spouseData.eircode
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Address</span>
                          <br />
                          <span v-if="spouseData.address">{{
                            spouseData.address
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start class="my-3" v-if="userApplicationData && userApplicationData.length > 0">
          <v-flex xs12 sm6 md8 lg8 text-start align-center pt-2 class="carousalhead">Applications
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start class="my-3">
          <v-flex xs12 v-if="userApplicationData && userApplicationData.length > 0">
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-data-table :headers="headers" :items="processedApplicationData" hide-default-footer
                  :items-per-page="limit" class="elevation-0" style="cursor: pointer" @click:row="viewUserDetails">
                  <!-- <template v-slot:[`item._id`]="{ item }">
                    <v-icon
                      small
                      color="primary"
                      class="ml-1"
                      @click.stop="viewUserDetails(item)"
                    >
                      mdi-eye
                    </v-icon>
                  </template> -->
                </v-data-table>
              </v-flex>
            </v-layout>
            <!-- pagination -->
            <v-layout wrap justify-center pt-2>
              <v-flex xs12>
                <div class="text-center pb-5" v-if="pages > 1">
                  <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
                </div>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex v-else>
            <v-card class="pa-4" outlined>
              <v-layout align-center justify-center>
                <v-flex text-center>
                  <v-icon size="48" color="grey lighten-1" class="mb-2">mdi-file-document-outline</v-icon>
                  <div class="subtitle-1 grey--text">
                    No applications found for this user
                  </div>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start class="my-3" v-if="
          userData &&
          userData.statusHistory &&
          userData.statusHistory.length > 0
        ">
          <v-flex xs12 sm6 md8 lg8 text-start align-center pt-2 class="carousalhead">Timeline
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start pb-10 v-if="
          userData &&
          userData.statusHistory &&
          userData.statusHistory.length > 0
        ">
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12 sm12 md12 lg12>
                <v-card class="pa-8 pt-10" outlined color="white">
                  <v-layout wrap justify-start px-4 pt-4>
                    <v-flex xs12>
                      <v-timeline dense>
                        <v-timeline-item small v-for="(item, index) in userData.statusHistory" :key="index">
                          <div style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">
                            {{ item.status }}
                            <span v-if="item.isAuto">(After Re-applying)</span>
                          </div>
                          <div>{{ formatDate(item.updatedAt) }}</div>
                        </v-timeline-item>
                      </v-timeline>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import http from "@/api/http";
export default {
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      keyword: "",
      usersList: [],
      showSnackBar: false,
      timeout: 5000,
      userData: {},
      spouseData: {},
      msg: "",
      fromPage: 1,
      headers: [
        { text: "Sl.No", value: "slno", align: "start" },
        // { text: "Application ID", value: "id", align: "start" },
        { text: "Application No", value: "applicationNo", align: "start" },
        { text: "Year", value: "year", align: "start" },
        { text: "Status", value: "status", align: "start" },
        { text: "Created At", value: "createdAt", align: "start" },
        // { text: "Actions", value: "id", align: "start", width: "50px" },
      ],
      appLoading: false,
      itemToDelete: null,
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 5,
      userApplicationData: [],
    };
  },
  mounted() {
    // Store the page number from which user navigated here
    this.fromPage = parseInt(this.$route.query.fromPage) || 1;
    this.getData();
    this.getUserApplicationData();
  },
  watch: {
    currentPage() {
      this.getUserApplicationData();
    },
  },
  computed: {
    formattedDateOfBirth() {
      if (!this.userData?.dob) return "_____________";

      let date;
      const dob = this.userData.dob;

      // Handle "DD/MM/YYYY" and "YYYY-MM-DD"
      if (dob.includes("/")) {
        const [day, month, year] = dob.split("/");
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dob);
      }

      if (isNaN(date)) return "Invalid Date";

      const options = { day: "2-digit", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-GB", options);
    },
    formattedSpouseDateOfBirth() {
      if (!this.spouseData?.dob) return "_____________";

      let date;
      const dob = this.spouseData.dob;

      // Handle "DD/MM/YYYY" and "YYYY-MM-DD"
      if (dob.includes("/")) {
        const [day, month, year] = dob.split("/");
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dob);
      }

      if (isNaN(date)) return "Invalid Date";

      const options = { day: "2-digit", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-GB", options);
    },
    processedApplicationData() {
      return this.userApplicationData.map((app, index) => ({
        ...app,
        slno: (this.currentPage - 1) * this.limit + index + 1,
        createdAt: this.formatDate(app.createdAt),
        applicationNo:
          app.applicationNo || `APP-${app.id?.slice(0, 8) || "N/A"}`,
      }));
    },
  },
  methods: {
    getData() {
      this.appLoading = true;
      http
        .get(`/users/${this.$route.query.id}`)
        .then((response) => {
          this.appLoading = false;

          // Map response data to expected format
          const apiData = response.data.data;

          this.userData = {
            // Field mapping: name → fullName for template compatibility
            fullName: apiData.name,
            email: apiData.email,
            phone: apiData.phone,
            dob: apiData.dob,
            profession: apiData.profession,
            ppsNumber: apiData.ppsNumber,
            eircode: apiData.eircode,
            address: apiData.address,
            maritalStatus: apiData.maritalStatus,

            // Handle potentially missing data
            spouse: apiData.spouse || null,
            statusHistory: apiData.statusHistory || [],
          };

          // Set spouse data if available
          this.spouseData = this.userData.spouse || {};
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
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    viewUserDetails(item) {
      // Redirect to another page with the application ID as a parameter
      this.$router.push({ name: "application-view", query: { id: item.id } });
    },
    getUserApplicationData() {
      this.appLoading = true;
      http
        .get("/applications/user", {
          params: {
            userId: this.$route.query.id,
            page: this.currentPage,
            size: this.limit,
          },
        })
        .then((response) => {
          this.appLoading = false;

          // Handle response based on new API structure
          if (Array.isArray(response.data.data)) {
            // New API returns array directly in data
            this.userApplicationData = response.data.data;
            // Calculate pages from metadata if available
            const total =
              response.data.metadata?.total || response.data.data.length;
            this.pages = Math.ceil(total / this.limit);
          } else {
            // Fallback for different response structure
            this.userApplicationData =
              response.data.data.applications || response.data.data;
            this.pages = Math.ceil(
              (response.data.data.total || response.data.data.length) /
              this.limit
            );
          }
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
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    },

       formatMaritalStatus(status) {
      if (!status) return "_____________";
      const statusMap = {
        single: "Single",
        married: "Married",
        divorced: "Divorced",
        widowed: "Widowed",
        separated: "Separated",
        civil_partnership: "Civil Partnership",
        married_spouse_abroad: "Married spouse abroad",
      };
      return statusMap[status.toLowerCase()] || status;
    },
    goBackToUserList() {
      // Navigate back to user list with the page number preserved
      this.$router.push({
        name: "users-list",
        query: { page: this.fromPage },
      });
    },
  },
};
</script>

<style scoped>
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
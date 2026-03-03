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

    <v-layout wrap justify-center pb-16>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">
          <v-flex xs12 sm6 md8 lg8 text-start align-center pt-2 class="carousalhead">
            <v-btn icon @click="$router.push('/review-list')" class="mr-2">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            Review Details
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12 sm12 md12 lg12>
                <v-card class="pa-8 pt-3" outlined color="white">
                  <v-layout wrap justify-start>
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4>
                        <v-flex xs12 pt-4>
                          <v-layout wrap justify-center>
                            <v-flex xs12 sm6 md6 lg2 text-start>
                              <span style="
                                  color: #f19d20;
                                  font-family: DMSans;
                                  font-size: 18px;
                                ">STATUS: {{ applicationReview.status }}</span>
                            </v-flex>
                            <v-flex xs12 sm6 md6 lg10 text-start>
                              <span v-if="
                                canEdit('reviews') &&
                                (applicationReview.status === 'pending' ||
                                  applicationReview.status === 'active')
                              " class="icon-circle green">
                                <v-icon color="white" @click="approvedialog = true">mdi-check</v-icon></span>&nbsp;<span
                                v-if="
                                  canEdit('reviews') &&
                                  (applicationReview.status === 'pending' ||
                                    applicationReview.status === 'active')
                                " class="icon-circle red">
                                <v-icon @click="rejectdialog = true" color="white">mdi-close</v-icon></span>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Rating</span>
                          <br />
                          <span v-if="applicationReview.rating">
                            <v-rating v-model="applicationReview.rating" color="warning lighten-1"
                              background-color="#1A73E9" empty-icon="$ratingFull" hover large readonly></v-rating>
                          </span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm12 md9 lg9 xl9 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Review</span>
                          <br />
                          <span v-if="applicationReview.review">{{
                            applicationReview.review
                          }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4>
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">User Details</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Name</span>
                          <br />
                          <span v-if="userData.name">{{
                            userData.name
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
                            ">Phone Number</span>
                          <br />
                          <span v-if="userData.phone">{{
                            userData.phone
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
                          <span v-if="userData.email">{{
                            userData.email
                          }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4>
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Application Details</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Year</span>
                          <br />
                          <span v-if="applicantdata.year">{{
                            applicantdata.year
                          }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Refund Amount</span>
                          <br />
                          <span v-if="applicantdata.refundAmount">{{ applicantdata.refundAmount }}/-</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Total Commission Amount</span>
                          <br />
                          <span v-if="applicantdata.totalCommissionAmount">{{ applicantdata.totalCommissionAmount
                          }}/-</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Status</span>
                          <br />
                          <span v-if="applicantdata.status">{{
                            applicantdata.status
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
      </v-flex>
    </v-layout>
    <v-dialog v-model="rejectdialog" max-width="600">
      <v-card class="dialog-card">
        <v-card-title class="grey lighten-2 d-flex justify-center">
          <v-icon color="red" size="32">mdi-alert</v-icon>
          <span class="ml-2">Confirm Deletion</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">Are you sure you want to reject the review?</div>


        </v-card-text>
        <v-card-actions class="d-flex justify-center pa-2">
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#cf3a45"
            @click="rejectdialog = false">Cancel</v-btn>
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#1A73E9"
            @click="confirmreject()">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="approvedialog" max-width="600">
      <v-card class="dialog-card">
        <v-card-title class="grey lighten-2 d-flex justify-center">
          <v-icon color="red" size="32">mdi-alert</v-icon>
          <span class="ml-2">Confirm Approval</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">Are you sure you want to approve the review?</div>


        </v-card-text>
        <v-card-actions class="d-flex justify-center pa-2">
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#cf3a45"
            @click="approvedialog = false">Cancel</v-btn>
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#1A73E9"
            @click="confirmapproval()">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import http from "@/api/http";
import permissionMixin from "@/mixins/permissionMixin";

export default {
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      rejectdialog: false,
      approvedialog: false,
      keyword: "",
      usersList: [],
      selectedStatus: null,
      showSnackBar: false,
      timeout: 5000,
      files: [],
      userData: {},
      spouseData: {},
      msg: "",
      appLoading: false,
      itemToDelete: null,
      statusItems: ["PROCESSING", "APPROVED"],
      status: null,
      page: 1,
      currentPage: 1,
      refundamount: null,
      pages: 0,
      limit: 10,
      applicantdata: {},
      applicationReview: {},
    };
  },
  mounted() {
    this.getData();
  },
  computed: {
    formattedDateOfBirth() {
      if (!this.userData.dob) return "_____________";
      const date = new Date(this.userData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    formattedspouseDateOfBirth() {
      if (!this.spouseData.dob) return "_____________";
      const date = new Date(this.spouseData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
  },
  methods: {
    updateStatusOptions() {
      if (this.backendStatus === "DOCUMENTS_UPLOADED") {
        this.statusOptions = ["PROCESSING"];
      } else if (this.backendStatus === "PROCESSING") {
        this.statusOptions = ["APPROVED"];
      } else {
        this.statusOptions = ["PROCESSING", "APPROVED"];
      }
    },
    getData() {
      this.appLoading = true;
      http
        .get(`/applications/reviews/${this.$route.query.id}`, {

        })
        .then((response) => {
          this.appLoading = false;
          this.applicationReview = response.data.data;
          // Fix: application is nested object, not applicationId
          this.applicantdata = response.data.data.application;
          this.backendStatus = this.applicantdata.status;
          // Fix: user is nested inside application object
          this.userData = response.data.data.application.user;
          this.spouseData = this.userData.spouseDetails || {};
          this.files = this.applicantdata.documents || [];
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
              this.msg = err.response.data.error || "An error occurred.";
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
    confirmreject() {
      this.appLoading = true;
      http
        .patch(`/applications/reviews/${this.$route.query.id}/status`, {
          status: "rejected"
        })
        .then((response) => {
          this.appLoading = false;
          this.msg = response.data.error || "Review rejected successfully";
          this.showSnackBar = true;
          this.rejectdialog = false;
          this.getData();
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
              this.msg = err.response.data.error || "An error occurred.";
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
    confirmapproval() {
      this.appLoading = true;
      http
        .patch(`/applications/reviews/${this.$route.query.id}/status`, {
          status: "approved"
        })
        .then((response) => {
          this.appLoading = false;
          this.msg = response.data.error || "Review approved successfully";
          this.showSnackBar = true;
          this.approvedialog = false;
          this.getData();
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
              this.msg = err.response.data.error || "An error occurred.";
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
    validateUpdate() {
      if (!this.selectedStatus) {
        this.msg = "Please Select Status";
        this.showSnackBar = true;
        return;
      } else if (this.selectedStatus === "APPROVED" && !this.refundamount) {
        this.msg = "Please Enter Refund Amount";
        this.showSnackBar = true;
        return;
      } else {
        this.updateStatus();
      }
    },
    updateStatus() {
      this.appLoading = true;
      http
        .post("/v1/admin/application/update-status", {
          status: this.selectedStatus,
          id: this.$route.query.id,
          refundAmount: this.refundamount,
        })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            this.msg = response.data.error;
            this.showSnackBar = true;
            this.getData();
          } else {
            this.msg = response.data.error;
            this.showSnackBar = true;
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
              this.msg = err.response.data.error || "An error occurred.";
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
    downloadPdf(pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.setAttribute("download", "file.pdf"); // Replace 'file.pdf' with your desired file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    formatDate(item) {
      var dt = new Date(item);
      var day = dt.getDate();
      var year = dt.getFullYear();
      var hours = dt.getHours();
      var minutes = dt.getMinutes();
      dt = dt.toString();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      day = day < 10 ? "0" + day : day;
      var strTime =
        day +
        " " +
        dt.slice(4, 7) +
        " " +
        year +
        " " +
        hours +
        ":" +
        minutes +
        " " +
        ampm;
      return strTime;
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

.icon-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e0e0e0;
  /* Default background color */
  cursor: pointer;
}

.icon-circle.green {
  background-color: green;
}

.icon-circle.red {
  background-color: red;
}

.icon-circle v-icon {
  color: white;
  /* Icon color */
}
</style>
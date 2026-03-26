<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <!-- Using global snackbar via this.$snackbar -->
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12>
        <welcome-header></welcome-header>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12 py-2 v-for="(file, index) in files" :key="index">
        <v-layout wrap justify-center style="background-color: #f1f7ff">
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex xs12 lg8 md8 sm8 text-left>
                <span style="
                    font-family: DMSans;
                    font-weight: 700;
                    font-size: 22px;
                    color: #000000;
                  ">Application No: {{ file.applicationNo }} / Year:
                  {{ file.year }}</span>
              </v-flex>
              <v-flex xs12 lg4 md4 sm4 text-end>
                <v-btn v-if="!file.isVisible" color="#1A73E9" rounded @click="toggleFileVisibility(index)">
                  <span style="
                      font-family: DMSans;
                      font-weight: 400;
                      font-size: 16px;
                      color: #ffffff;
                    ">
                    <v-icon>mdi-arrow-down</v-icon>
                  </span>
                </v-btn>
                <v-btn v-if="file.isVisible" color="#1A73E9" rounded @click="toggleFileVisibility(index)">
                  <span style="
                      font-family: DMSans;
                      font-weight: 400;
                      font-size: 16px;
                      color: #ffffff;
                    ">
                    <v-icon>mdi-arrow-up</v-icon>
                  </span>
                </v-btn>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-center pt-4 v-if="file.isVisible">
              <v-flex xs12>
                <v-layout wrap justify-end>
                  <v-flex xs12 text-end v-if="file && file.invoiceId">
                    <span class="invoice">Invoice Number:</span>&nbsp;<span class="invoicesub">{{ file.invoiceId
                    }}</span>
                  </v-flex>
                  <v-flex xs12 text-end>
                    <span class="invoice"> Date:</span>&nbsp;<span class="invoicesub">{{ formatDateOnly(file.createdAt)
                    }}</span>
                  </v-flex>
                  <v-flex xs12 text-end>
                    <span class="invoice">Customer Name:</span>&nbsp;<span class="invoicesub">{{ appUser }}</span>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-center pt-4 v-if="file.isVisible">
              <v-flex xs12 text-left>
                <span style="
                    font-family: DMSans;
                    font-weight: 700;
                    font-size: 22px;
                    color: #000000;
                  ">Refund Breakdown</span>
              </v-flex>
              <v-flex xs12 pt-4>
                <v-card rounded="lg" flat>
                  <v-layout wrap justify-center>
                    <v-flex xs12 pa-5>
                      <v-layout wrap justify-center>
                        <v-flex xs12 sm6 lg6 :text-left="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            ">Total Refund Approved</span>
                        </v-flex>
                        <v-flex xs12 sm6 lg6 :text-end="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            "><span v-if="file && file.refundAmount">
                              € {{ file.refundAmount }}
                            </span>
                            <span v-else>€ 0</span>
                          </span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-center pt-4 v-if="file.isVisible">
              <v-flex xs12 text-left>
                <span style="
                    font-family: DMSans;
                    font-weight: 700;
                    font-size: 22px;
                    color: #000000;
                  ">Commission Payment Details</span>
              </v-flex>
              <v-flex xs12 pt-4>
                <v-card rounded="lg" flat>
                  <v-layout wrap justify-center>
                    <v-flex xs12 pa-5>
                      <v-layout wrap justify-center>
                        <v-flex xs12 sm6 md6 lg6 :text-left="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            ">Commission Fee ({{
                              file.commissionPercentage
                            }}%)</span>
                        </v-flex>
                        <v-flex xs12 sm6 md6 lg6 :text-end="$vuetify.breakpoint.xs ? false : true">
                          <span v-if="file && file.commissionAmount" style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€
                            {{
                              file.commissionAmount
                                ? Number(file.commissionAmount).toFixed(2)
                                : "0.00"
                            }}</span>
                          <span v-else style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€ 0</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center pt-4>
                        <v-flex xs12 sm6 md6 lg6 :text-left="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            ">VAT Fee ({{ file.vatPercentage }}%)</span>
                        </v-flex>
                        <v-flex xs12 sm6 md6 lg6 :text-end="$vuetify.breakpoint.xs ? false : true">
                          <span v-if="file && file.vatAmount" style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€
                            {{
                              file.vatAmount
                                ? Number(file.vatAmount).toFixed(2)
                                : "0.00"
                            }}</span>
                          <span v-else style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€ 0</span>
                        </v-flex>
                      </v-layout>
                      <!-- <v-layout wrap justify-center pt-4>
                          <v-flex xs12 sm6 md6 lg6 text-left>
                            <span
                              style="
                                font-family: DMSans;
                                font-weight: 400;
                                font-size: 18px;
                              "
                              >Promo code Applied</span
                            >
                          </v-flex>
                          <v-flex xs12 sm6 md6 lg6 text-end>
                            <span
                              v-if="file && file.promoCodeApplied"
                              style="
                                font-family: DMSans;
                                font-weight: 500;
                                font-size: 18px;
                              "
                              >-€ 1928.00</span
                            >
                            <span
                              v-else
                              style="
                                font-family: DMSans;
                                font-weight: 500;
                                font-size: 18px;
                              "
                              >€ 0</span
                            >
                          </v-flex>
                        </v-layout> -->

                      <v-layout wrap justify-center pt-4>
                        <v-flex xs12 sm6 md6 lg6 :text-left="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            ">Payment Method</span>
                        </v-flex>
                        <v-flex xs12 sm6 md6 lg6 :text-end="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">{{ formatPaymentMethod(file?.paymentMethod) }}</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center pt-4>
                        <v-flex xs12 sm6 md6 lg6 :text-left="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            ">Total</span>
                        </v-flex>
                        <v-flex xs12 sm6 md6 lg6 :text-end="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            "><span v-if="file && file.finalAmount">€
                              {{
                                file.finalAmount
                                  ? Number(file.finalAmount).toFixed(
                                    2
                                  )
                                  : "0.00"
                              }}</span>
                            <span v-else>€ 0</span></span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center pt-4 v-if="file && file.discountAmount">
                        <v-flex xs12 sm6 md6 lg6 :text-left="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            ">Discount</span>
                        </v-flex>
                        <v-flex xs12 sm6 md6 lg6 :text-end="$vuetify.breakpoint.xs ? false : true">
                          <span v-if="file && file.discountAmount" style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€
                            {{
                              file.discountAmount
                                ? Number(file.discountAmount).toFixed(2)
                                : "0.00"
                            }}</span>
                          <span v-else style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€ 0</span>
                        </v-flex>
                      </v-layout>

                      <v-layout wrap justify-center pt-4>
                        <v-flex xs12 sm6 md6 lg6 :text-left="$vuetify.breakpoint.xs ? false : true">
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                            ">Flat Fee</span>
                        </v-flex>
                        <v-flex xs12 sm6 md6 lg6 :text-end="$vuetify.breakpoint.xs ? false : true">
                          <span v-if="file && file.flatFee" style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€
                            {{
                              file.flatFee
                                ? Number(file.flatFee).toFixed(2)
                                : "0.00"
                            }}</span>
                          <span v-else style="
                              font-family: DMSans;
                              font-weight: 500;
                              font-size: 18px;
                            ">€ 0</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
              <v-flex xs12 pt-4>
                <v-layout wrap justify-center>
                  <v-flex xs12 :text-end="$vuetify.breakpoint.xs ? false : true" pr-4>
                    <span style="
                        font-family: DMSans;
                        font-weight: 700;
                        font-size: 18px;
                        color: #043a82;
                      ">Total Amount Paid : </span><span style="
                        font-family: DMSans;
                        font-weight: 700;
                        font-size: 20px;
                        color: #043a82;
                      "><span v-if="file && file.finalAmount">€
                        {{
                          file.finalAmount
                            ? Number(file.finalAmount).toFixed(2)
                            : "0.00"
                        }}</span>
                      <span v-else>€ 0</span></span>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-center pt-16 v-if="file.isVisible">
              <v-flex xs12 text-left>
                <span style="
                    font-family: DMSans;
                    font-weight: 400;
                    font-size: 18px;
                    color: #000000;
                  ">Thank you for choosing Taxmind for your tax refund
                  processing!</span>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-start pt-2 v-if="
              file.isVisible && file.status === 'APPROVED' && !file.review
            ">
              <v-flex xs12 text-left>
                <span style="
                    font-family: DMSans;
                    font-weight: 400;
                    font-size: 18px;
                    color: #000000;
                  ">Rate your experience with Taxmind</span>
              </v-flex>
              <v-flex xs12 text-left pt-2>
                <v-rating v-model="file.rating" color="warning lighten-1" background-color="#1A73E9"
                  empty-icon="$ratingFull" hover large></v-rating>
              </v-flex>
              <v-flex xs12 sm5 lg4 text-left pt-2>
                <v-textarea v-model="file.remarks" class="rounded-lg pt-1" solo dense placeholder="Comments" outlined
                  flat hide-details>
                </v-textarea>
              </v-flex>
              <v-flex xs12 text-left pt-3>
                <v-btn color="success" @click="applyreview(file)" style="font-family: DMSans">Submit</v-btn>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-start pt-2 v-if="file.isVisible && file.status === 'APPROVED' && file.review">
              <v-flex xs12 text-left>
                <span style="
                    font-family: DMSans;
                    font-weight: 400;
                    font-size: 18px;
                    color: #000000;
                  ">Thank you for your feedback.</span>
              </v-flex>
              <v-flex xs12 text-left pt-2>
                <v-rating v-model="file.review.rating" color="warning lighten-1" background-color="#1A73E9"
                  empty-icon="$ratingFull" hover large readonly></v-rating>
              </v-flex>
              <v-flex xs12 sm5 lg4 text-left pt-2>
                <v-textarea v-model="file.review.review" class="rounded-lg pt-1" solo dense placeholder="Comments"
                  outlined flat hide-details readonly>
                </v-textarea>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center pt-2>
      <v-flex xs12 v-if="files && files.length > 0">
        <div class="text-center pb-5" v-if="pages > 1">
          <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
        </div>
      </v-flex>
      <v-flex xs12 v-else>
        <v-layout wrap justify-center>
          <v-flex xs12>
            <span style="font-family: DMSans">No Records Found!</span>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title><span style="font-family: DMSans">Start New Claim</span></v-card-title>
        <v-card-text>
          <v-layout wrap justify-center>
            <v-flex xs12>
              <v-layout wrap justify-center>
                <v-flex xs12 text-left>
                  <span style="font-family: DMSans; font-size: 18px; color: black">Claim Year</span>
                  <v-select v-model="claimyear" class="rounded-lg pt-1" solo dense :items="claimyearList" outlined flat
                    hide-details style="font-family: DMSans">
                  </v-select>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialog = false" style="font-family: DMSans">Close</v-btn>
          <v-btn color="success" @click="newClaim()" style="font-family: DMSans">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import axios from "axios";
import WelcomeHeader from "../Common/WelcomeHeader.vue";
export default {
  components: { WelcomeHeader },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      claimyear: null,
      claimyearList: [],
      userData: {},
      name: null,
      dialog: false,
      pages: 0,
      limit: 10,
      currentPage: 1,
      applicationId: "",
      email: null,
      phone: null,
      documentcategory: null,
      documentcategorylist: [],
      dob: null,
      uploadedFileName: "",
      applicationData: [],
      rating: "",
      remarks: "",
      // files: [
      //   { name: "medical_bills.zip", date: "17-12-24" },
      //   { name: "insurance_claims.zip", date: "17-12-24" },
      //   { name: "tax_documents.zip", date: "17-12-24" },
      // ],
      files: [],
      e1: 2,
    };
  },
  beforeMount() {
    this.getData();
    this.generateYears();
  },
  watch: {
    currentPage() {
      this.getData();
    },
  },
  computed: {
    appUser() {
      return this.$store.state.userName;
    },
  },
  methods: {
    generateYears() {
      const currentYear = new Date().getFullYear();
      this.claimyearList = Array.from({ length: 5 }, (_, i) => currentYear - i); // Generate years from current year to 5 years back
    },
    newClaim() {
      if (!this.claimyear) {
        this.$snackbar.showError("Please Select Claim Year");
        return;
      }
      this.appLoading = true;
      axios({
        url: "/user/application/apply",
        method: "POST",
        data: {
          year: this.claimyear,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            this.$snackbar.showSuccess(response.data.message);
            this.claimyear = null;
            this.dialog = false;
            this.appLoading = false;
            this.$router.push({ path: "/application" });
          } else {
            this.$snackbar.showError(response.data.message);
            this.appLoading = false;
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
    applyreview(item) {
      this.applicationId = item._id;
      this.rating = item.rating;
      this.remarks = item.remarks;
      if (!this.rating || !this.remarks) {
        this.msg = "Please enter rating and remarks";
        this.$snackbar.showError(this.msg);
        return;
      }
      this.appLoading = true;
      axios({
        url: "/user/application-review/add-update",
        method: "POST",
        data: {
          applicationId: this.applicationId,
          rating: this.rating,
          review: this.remarks,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            this.msg = response.data.message;
            this.$snackbar.showSuccess(this.msg);
            this.appLoading = false;
            this.getData();
          } else {
            this.msg = response.data.message;
            this.$snackbar.showError(this.msg);
            this.appLoading = false;
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
    formatDateOnly(item) {
      var dt = new Date(item);
      var day = dt.getDate();
      var year = dt.getFullYear();
      dt = dt.toString();
      var strTime = day + " " + dt.slice(4, 7) + " " + year;
      return strTime;
    },
    getData() {
      this.appLoading = true;
      axios({
        method: "GET",
        url: "/applications/claims",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
        params: {
          limit: this.limit,
          page: this.currentPage,
        },
      })
        .then((response) => {
          console.log(response);

          this.appLoading = false;
          this.pages = Math.ceil(response.data.metadata.total / this.limit);
          this.files = response.data.data.map((file) => ({
            ...file,
            isVisible: false,
          }));
        })
        .catch((err) => {
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
        });
    },
    toggleFileVisibility(index) {
      this.files[index].isVisible = !this.files[index].isVisible;
    },
    formatPaymentMethod(method) {
      if (!method) return '-';

      // Convert to lowercase for comparison
      const methodLower = method.toLowerCase();

      // Map backend values to user-friendly text
      const paymentMethodMap = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'online': 'Online',
        'card': 'Card',
        'stripe': 'Online',
        'cheque': 'Cheque',
        'other': 'Other',
      };

      return paymentMethodMap[methodLower] || method.charAt(0).toUpperCase() + method.slice(1);
    },
  },
};
</script>
<style scoped>
.profilehead {
  font-family: DMSans;
  font-weight: 400;
  font-size: 20px;
}

.profilename {
  font-family: DMSans;
  font-weight: 700;
  text-transform: capitalize;
  font-size: 20px;
  color: rgba(28, 103, 201, 1);
}

.myprofile {
  font-family: DMSans;
  font-weight: 700;
  font-size: 23px;
  color: rgba(0, 0, 0, 1);
}

.subdata {
  color: rgba(30, 111, 235, 1);
  font-family: DMSans;
  font-weight: 700;
  font-size: 18px;
}

.subsubdata {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
  color: rgba(26, 26, 26, 1);
}

.status {
  font-family: DMSans;
  font-weight: 400;
  font-size: 17px;
  text-transform: uppercase;
}

.statuschange {
  font-family: DMSans;
  font-weight: 700;
  font-size: 18px;
  color: #f19d20;
  text-transform: capitalize;
}

.stephead {
  font-family: DMSans;
  font-weight: 500;
  font-size: 18px;
}

.invoice {
  font-family: DMSans;
  font-weight: 400;
  font-size: 16px;
  color: #043a82e8;
  text-transform: uppercase;
}

.invoicesub {
  font-family: DMSans;
  font-weight: 700;
  font-size: 18px;
  color: #000000;
  text-transform: uppercase;
}
</style>

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
    <!-- notifications shown via global this.$snackbar -->
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12>
        <v-layout wrap justify-center style="background-color: #d6e7ff">
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex xs12 lg8 md7 sm6 text-left>
                <span class="profilehead"
                  >Welcome ! ,<span class="profilename">{{ name }}</span> Let’s
                  start your tax refund journey.</span
                >
              </v-flex>
              <v-flex xs12 lg4 md5 sm6 text-end>
                <v-btn color="#1A73E9" rounded @click="dialog = true">
                  <span
                    style="
                      font-family: DMSans;
                      font-weight: 600;
                      font-size: 16px;
                      color: #ffffff;
                    "
                    >Start New Claim</span
                  >
                </v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12 py-2 v-for="(file, index) in files" :key="index">
        <v-layout wrap justify-center style="background-color: #d6e7ff">
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex xs12 lg8 md7 sm6 text-left>
                <span
                  style="
                    font-family: DMSans;
                    font-weight: 700;
                    font-size: 22px;
                    color: #000000;
                  "
                  >{{ file.name }}</span
                >
              </v-flex>
              <v-flex xs12 lg4 md5 sm6 text-end>
                <v-btn
                  color="#1A73E9"
                  rounded
                  download
                  :href="fileURL + file.template"
                  target="_blank"
                >
                  <span
                    style="
                      font-family: DMSans;
                      font-weight: 400;
                      font-size: 16px;
                      color: #ffffff;
                    "
                    ><v-icon small>mdi-download</v-icon>Download</span
                  >
                </v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title
          ><span style="font-family: DMSans"
            >Start New Claim</span
          ></v-card-title
        >
        <v-card-text>
          <v-layout wrap justify-center>
            <v-flex xs12>
              <v-layout wrap justify-center>
                <v-flex xs12 text-left>
                  <span
                    style="font-family: DMSans; font-size: 18px; color: black"
                    >Claim Year</span
                  >
                  <v-select
                    v-model="claimyear"
                    class="rounded-lg pt-1"
                    solo
                    dense
                    :items="claimyearList"
                    outlined
                    flat
                    hide-details
                    style="font-family: DMSans"
                  >
                  </v-select>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="dialog = false"
            style="font-family: DMSans"
            >Close</v-btn
          >
          <v-btn
            color="success"
            @click="dialog = false"
            style="font-family: DMSans"
            >Apply</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
        <script>
import axios from "axios";
export default {
  data() {
    return {
      appLoading: false,
      ServerError: false,
      claimyear: null,
      claimyearList: [],
      userData: {},
      name: null,
      dialog: false,
      email: null,
      phone: null,
      documentcategory: null,
      documentcategorylist: [],
      dob: null,
      uploadedFileName: "",
      applicationData: [],
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
  methods: {
    generateYears() {
      const currentYear = new Date().getFullYear();
      this.claimyearList = Array.from({ length: 5 }, (_, i) => currentYear - i); // Generate years from current year to 5 years back
    },
    getData() {
      this.appLoading = true;
      axios({
        method: "GET",
        url: "/user/document-template/list",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          this.appLoading = false;
          this.files = response.data.data.documentTemplates;
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 422) {
              // Handle validation error
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
            } else if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.$snackbar.showError(
                "A server error occurred. Please try again later."
              );
            } else {
              // Handle other errors
              this.ServerError = true;
              this.msg = "An unexpected error occurred. Please try again.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.$snackbar.showError(
              "An unexpected error occurred. Please try again."
            );
          }
        });
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
</style>

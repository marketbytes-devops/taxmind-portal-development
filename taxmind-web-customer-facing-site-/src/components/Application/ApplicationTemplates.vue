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
    <!-- global snackbar: use this.$snackbar.showSuccess / showError -->
    <welcome-header />
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12 py-2 v-for="(file, index) in files" :key="index">
        <v-layout wrap justify-center style="background-color: #f1f7ff">
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex xs3 lg8 md7 sm6 text-left>
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
              <v-flex xs9 lg4 md5 sm6 text-end>
                <v-btn
                  color="#1A73E9"
                  rounded
                  download
                  :href="file.templateFile.filePath"
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
    <v-layout wrap justify-center pt-5 v-if="files && files.length === 0">
      <v-flex xs12>
        <span style="font-family: DMSans">No Templates Found!</span>
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
          <v-btn color="success" @click="newClaim()" style="font-family: DMSans"
            >Apply</v-btn
          >
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
    getData() {
      this.appLoading = true;
      axios({
        method: "GET",
        url: "/site-contents/document-templates",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          this.appLoading = false;
          this.files = response.data.data;
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
</style>

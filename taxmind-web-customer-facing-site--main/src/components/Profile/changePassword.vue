<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <!-- Global snackbar used via this.$snackbar -->




    <welcome-header></welcome-header>



    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12>
        <v-layout wrap justify-center style="background-color: #f1f7ff">
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex xs12 sm4 md4 lg4>
                <v-text-field v-model="oldpassword" class="rounded-lg pt-1"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" :type="showPassword ? 'text' : 'password'"
                  @click:append="showPassword = !showPassword" solo dense placeholder="Old Password" outlined flat
                  hide-details style="font-family: opensansregular">
                </v-text-field>
              </v-flex>
              <v-flex xs12 sm4 md4 lg4 pl-lg-2 pl-md-2 pl-sm-2 pt-2 pt-sm-0>
                <v-text-field v-model="confirmPassword" class="rounded-lg pt-1"
                  :append-icon="shownewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="shownewPassword ? 'text' : 'password'" @click:append="shownewPassword = !shownewPassword" solo
                  dense placeholder="New Password " outlined flat hide-details style="font-family: opensansregular">
                </v-text-field>
              </v-flex>
              <v-flex xs12 sm4 md4 lg4 pl-lg-2 pl-md-2 pl-sm-2 pt-2 pt-sm-0>
                <v-text-field v-model="confirmnewPassword" class="rounded-lg pt-1" :append-icon="showconfirmnewPassword ? 'mdi-eye' : 'mdi-eye-off'
                  " :type="showconfirmnewPassword ? 'text' : 'password'" @click:append="
                    showconfirmnewPassword = !showconfirmnewPassword
                    " solo dense placeholder=" Confirm Password " outlined flat hide-details
                  style="font-family: opensansregular">
                </v-text-field>
              </v-flex>
              <v-flex xs12 sm4 md4 lg4 pb-1 pt-5 text-end>
                <v-btn @click="verifyInput" color="#1A73E9" class="rounded-lg" block>
                  <span class="otpbtn">Update</span>
                </v-btn>
              </v-flex>
            </v-layout>
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
import { ApiMigrationMixin } from "@/utils/apiMigration";
import WelcomeHeader from "../Common/WelcomeHeader.vue";

export default {
  mixins: [ApiMigrationMixin],
  components: {
    WelcomeHeader,
  },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      // Global snackbar used via this.$snackbar
      claimyear: null,
      showPassword: false,
      shownewPassword: false,
      showconfirmnewPassword: false,
      claimyearList: [],
      dialog: false,
      oldpassword: "",
      confirmPassword: "",
      confirmnewPassword: "",
    };
  },
  beforeMount() {
    this.generateYears();
  },
  computed: {
    appUser() {
      return this.$store.state.userName;
    },
  },
  methods: {
    verifyInput() {
      if (!this.oldpassword) {
        this.$snackbar.showError("Please Provide Old Password");
        return;
      }
      if (!this.confirmPassword) {
        this.$snackbar.showError("Please Provide New Password");
        return;
      }
      if (this.oldpassword === this.confirmPassword) {
        this.$snackbar.showError(
          "Old Password and New Password Cannot Not Be Same"
        );
        return;
      }
      if (this.confirmnewPassword !== this.confirmPassword) {
        this.$snackbar.showError(
          "New Password And Confirm New Password Are Not Same"
        );
        return;
      }
      this.createPassword();
    },
    async newClaim() {
      if (!this.claimyear) {
        this.$snackbar.showError("Please Select Claim Year");
        return;
      }

      try {
        // Using new applications endpoint
        const response = await this.submitData("/applications", {
          year: this.claimyear,
        });

        if (response.status) {
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiSuccess === "function"
            ) {
              this.$snackbar.showApiSuccess(
                response || { message: "New Claim Created Successfully" }
              );
            } else {
              this.$snackbar.showSuccess(
                response.message || "New Claim Created Successfully"
              );
            }
          } catch (e) {
            this.$snackbar.showSuccess(
              response.message || "New Claim Created Successfully"
            );
          }
          this.claimyear = null;
          this.dialog = false;
          this.$router.push({ path: "/application" });
        } else {
          this.$snackbar.showError(response.message);
        }
      } catch (error) {
        console.error("New claim creation failed:", error);
      }
    },
    generateYears() {
      const currentYear = new Date().getFullYear();
      this.claimyearList = Array.from({ length: 5 }, (_, i) => currentYear - i); // Generate years from current year to 5 years back
    },
    async createPassword() {
      try {
        const passwordData = {
          currentPassword: this.oldpassword,
          newPassword: this.confirmPassword,
        };

        // Using new standardized endpoint
        const response = await this.submitData(
          "/users/auth/password/change",
          passwordData
        );

        if (response.status) {
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiSuccess === "function"
            ) {
              this.$snackbar.showApiSuccess(response);
            } else {
              this.$snackbar.showSuccess(response.message);
            }
          } catch (e) {
            this.$snackbar.showSuccess(response.message);
          }
          this.oldpassword = null;
          this.confirmPassword = null;
          this.confirmnewPassword = null;
        }
      } catch (error) {
        console.error("Password change failed:", error);
      }
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

.otpbtn {
  font-family: DMSans;
  font-weight: 500;
  font-size: 16px;
  color: #ffffff;
}

.profilename {
  font-family: DMSans;
  font-weight: 700;
  font-size: 20px;
  color: rgba(28, 103, 201, 1);
  text-transform: capitalize;
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
<template>
  <div>
    <!-- notifications shown via global this.$snackbar -->
    <v-flex xs12 sm12 md12 lg12 pt-16 pb-10>
      <v-layout wrap justify-center>
        <v-flex xs11 sm6 md6 lg4 pt-13 pb-10>
          <div class="create-password-container">
            <v-card
              flat
              rounded="lg"
              color="#FFFFFF"
              elevation="2"
              class="password-card"
            >
              <v-layout wrap justify-center pa-5 pa-sm-14>
                <v-flex xs12>
                  <v-layout wrap justify-start>
                    <v-flex xs6 lg4 md6 sm6>
                      <v-img
                        src="../../assets/toplogo.png"
                        contain
                        alt="otplogo"
                      ></v-img>
                    </v-flex>
                    <v-flex xs12 text-start pt-3>
                      <span class="passhead">Create a New Password</span>
                    </v-flex>
                    <v-flex xs12 lg12 text-start pt-3>
                      <span class="passsubhead">
                        Enter a strong password with at least 8 characters,
                        including a mix of letters, numbers, and symbols
                      </span>
                    </v-flex>
                    <v-flex xs12 lg11 pt-3>
                      <v-text-field
                        v-model="newPassword"
                        class="rounded-lg pt-1"
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        :type="showPassword ? 'text' : 'password'"
                        @click:append="showPassword = !showPassword"
                        solo
                        dense
                        placeholder="New Password"
                        outlined
                        flat
                        hide-details
                        style="font-family: opensansregular"
                      ></v-text-field>
                    </v-flex>
                    <v-flex xs12 lg11 pt-3>
                      <v-text-field
                        v-model="confirmnewPassword"
                        class="rounded-lg pt-1"
                        solo
                        dense
                        placeholder="Confirm Password"
                        outlined
                        :append-icon="
                          showconfirmPassword ? 'mdi-eye' : 'mdi-eye-off'
                        "
                        :type="showconfirmPassword ? 'text' : 'password'"
                        @click:append="
                          showconfirmPassword = !showconfirmPassword
                        "
                        flat
                        hide-details
                        style="font-family: opensansregular"
                      ></v-text-field>
                    </v-flex>
                    <v-flex xs12 lg11 pb-1 pt-5 text-center>
                      <v-btn
                        @click="verifyInput"
                        color="#1A73E9"
                        class="rounded-lg"
                        block
                      >
                        <span class="otpbtn">Submit</span>
                      </v-btn>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-card>
          </div>
        </v-flex>
      </v-layout>
    </v-flex>
  </div>
</template>

<script>
import { ApiMigrationMixin } from "@/utils/apiMigration";
export default {
  mixins: [ApiMigrationMixin],
  data() {
    return {
      appLoading: false,
      ServerError: false,
      // Global snackbar used via this.$snackbar
      showPassword: false,
      showconfirmPassword: false,
      newPassword: null,
      confirmnewPassword: null,
      otp: this.$route.query.otp,
      email: this.$route.query.email,
    };
  },
  methods: {
    verifyInput() {
      if (!this.newPassword) {
        this.$snackbar.showError("Please Provide New Password");
        return;
      }
      if (!this.confirmnewPassword) {
        this.$snackbar.showError("Please Provide Confirm Password");
        return;
      }
      if (this.newPassword !== this.confirmnewPassword) {
        this.$snackbar.showError(
          "New Password and Confirm Password do not match"
        );
        return;
      }
      this.createPassword();
    },
    async createPassword() {
      try {
        const payload = {
          email: this.email,
          otp: parseInt(this.otp),
          newPassword: this.newPassword,
        };

        const response = await this.submitData(
          "/users/auth/password/reset",
          payload
        );

        if (
          response.success ||
          response.status === 200 ||
          response.status === true
        ) {
          try {
            // Prefer backend message if present
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiSuccess === "function"
            ) {
              this.$snackbar.showApiSuccess(response);
            } else {
              this.$snackbar.showSuccess(response?.message || "");
            }
          } catch (e) {
            this.$snackbar.showSuccess(response?.message || "");
          }
          this.newPassword = null;
          this.confirmnewPassword = null;
          this.$router.push({ name: "login" });
        } else {
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              this.$snackbar.showApiError(
                response || { error: "Failed to create password" }
              );
            } else {
              this.$snackbar.showError(response?.message || "");
            }
          } catch (e) {
            this.$snackbar.showError(response?.message || "");
          }
        }
      } catch (error) {
        console.error("Create password failed:", error);
        // ApiMigrationMixin may handle errors; show a generic message only if necessary
        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            this.$snackbar.showApiError(
              error || { error: "An error occurred while creating password." }
            );
          } else {
            this.$snackbar.showError(error?.message || "");
          }
        } catch (e) {
          this.$snackbar.showError(error?.message || "");
        }
      }
    },
  },
};
</script>

<style scoped>
.password-card {
  max-width: 640px;
  margin: 32px auto;
}
.passhead {
  font-family: DMSans;
  font-weight: 700;
  font-size: 25px;
  color: #292727;
}
.passsubhead {
  font-family: DMSans;
  font-weight: 400;
  font-size: 16px;
  color: #28272996;
}
.otpbtn {
  font-family: DMSans;
  font-weight: 500;
  font-size: 16px;
  color: #ffffff;
}
.applyhead {
  font-family: FajallaOne;
  font-size: 24px;
  font-weight: 400;
  color: #1b1212;
}
.applysubhead {
  font-family: DMSans;
  font-size: 18px;
  font-weight: 400;
  color: #000000bd;
}
.tandc {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
}
.otpresend {
  font-family: DMSans;
  font-weight: 500;
  font-size: 15px;
  color: #104790;
}
</style>

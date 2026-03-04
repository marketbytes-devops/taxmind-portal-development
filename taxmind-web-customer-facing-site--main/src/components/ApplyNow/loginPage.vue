<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" />
    <!-- Global snackbar is mounted in App.vue and exposed as this.$snackbar -->
    <v-layout wrap justify-center>
      <v-flex xs12>
        <v-layout wrap justify-center> </v-layout>
        <v-layout wrap justify-center fill-height mt-6 mt-lg-8 mt-md-8 mt-sm-6 pt-4 pt-sm-14>
          <v-flex xs12 sm12 md12 lg12 pt-16 pb-10>
            <v-layout wrap justify-center>
              <v-flex xs11 sm6 md6 lg4 pt-13 pb-10>
                <v-card flat rounded="lg" color="#FFFFFF" elevation="2">
                  <v-layout wrap justify-center pa-5 pa-sm-14>
                    <v-flex xs12>
                      <v-layout wrap justify-start>
                        <v-flex xs6 lg4 md6 sm6>
                          <v-img src="../../assets/toplogo.png" contain alt="otplogo"></v-img>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start>
                        <v-flex xs12 lg12 text-start pt-1>
                          <span class="loginsubhead">Please enter your details</span>
                        </v-flex>
                        <v-flex xs12 text-start pt-1>
                          <span class="loginhead">Welcome Back</span>
                        </v-flex>
                        <v-flex xs4 lg2 md2 sm3><v-progress-linear value="100"></v-progress-linear></v-flex>
                        <v-flex xs12 lg11 pt-3>
                          <v-text-field v-model="email" class="rounded-lg pt-1" solo dense placeholder="Email Address"
                            outlined flat hide-details style="font-family: opensansregular">
                          </v-text-field>
                        </v-flex>
                        <v-flex xs12 lg11 pt-3>
                          <v-text-field v-model="password" class="rounded-lg pt-1" :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'
                            " :type="showPassword ? 'text' : 'password'" @click:append="showPassword = !showPassword"
                            solo dense placeholder="Password" outlined flat hide-details
                            style="font-family: opensansregular">
                          </v-text-field>
                        </v-flex>
                        <v-flex xs12 lg11 text-end pt-5>
                          <span class="frgtpass" @click="redirectToForgotPassword">Forgot password</span>
                        </v-flex>
                        <v-flex xs12 lg11 pb-1 pt-5 text-center>
                          <v-btn @click="verifyInput" color="#1A73E9" class="rounded-lg" block>
                            <span class="loginbtn">Log in</span>
                          </v-btn>
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

    <!-- Reactivation Dialog -->
    <v-dialog v-model="showReactivateDialog" max-width="450" persistent>
      <v-card class="rounded-xl pa-4">
        <v-card-title class="headline text-center justify-center">
          <v-icon color="#1A73E9" size="48" class="mb-2">mdi-account-reactivate</v-icon>
          <div class="w-100">Activate Account?</div>
        </v-card-title>
        <v-card-text class="text-center subtitle-1 pb-6">
          Your account is currently inactive. Do you want to activate this account?
          <div v-if="lastRemark" class="mt-4 pa-3 grey lighten-4 rounded-lg text-left italic">
            <strong>Last Remark:</strong> {{ lastRemark }}
          </div>
        </v-card-text>
        <v-card-actions class="pb-4 justify-center">
          <v-btn color="grey darken-1" text @click="showReactivateDialog = false" class="px-6 rounded-lg">
            No
          </v-btn>
          <v-btn color="#1A73E9" dark @click="confirmReactivation" class="px-6 rounded-lg ml-3">
            Yes, Activate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ApiMigrationMixin } from "@/utils/apiMigration";
import FCMService from "@/services/fcm";

export default {
  mixins: [ApiMigrationMixin],
  data() {
    return {
      appLoading: false,
      ServerError: false,
      // Local snackbar removed; use this.$snackbar
      showPassword: false,
      email: null,
      password: null,
      showReactivateDialog: false,
      lastRemark: null,
    };
  },
  methods: {
    async confirmReactivation() {
      this.appLoading = true;
      try {
        const response = await this.submitData("/users/auth/reactivate", {
          email: this.email,
        });
        if (response.success) {
          this.$snackbar.showSuccess("Account reactivated! Please log in.");
          this.showReactivateDialog = false;
        } else {
          throw new Error(response.message || "Reactivation failed");
        }
      } catch (error) {
        this.handleApiError(error);
      } finally {
        this.appLoading = false;
      }
    },
    redirectToForgotPassword() {
      this.$router.push({ name: "forgot-password" });
    },
    verifyInput() {
      if (!this.email) {
        this.$snackbar.showError("Please Provide Email Address");
        return;
      }
      if (!this.password) {
        this.$snackbar.showError("Please Provide Password");
        return;
      }
      this.loginUser();
    },

    async loginUser() {
      const payload = {
        email: this.email,
        password: this.password,
      };

      try {
        // ApiMigrationMixin's submitData handles loading and basic error states automatically
        const response = await this.submitData("/users/auth/signin", payload);
        this.handleLoginSuccess(response);
      } catch (error) {
        console.error("Login error:", error);
        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            this.$snackbar.showApiError(
              error || { error: "Login failed. Please try again." }
            );
          } else {
            const apiMsg =
              error?.response?.data?.error || error?.response?.data?.message;
            this.$snackbar.showError(
              apiMsg || error?.message || "Login failed. Please try again."
            );
          }
        } catch (e) {
          const apiMsg =
            error?.response?.data?.error || error?.response?.data?.message;
          this.$snackbar.showError(
            apiMsg || error?.message || "Login failed. Please try again."
          );
        }
      }
    },
    async handleLoginSuccess(response) {
      // Clear form
      this.resetForm();

      // Extract verification status and user data
      const data = response.data;
      const isEmailVerified =
        data?.user?.isEmailVerified || data?.isEmailVerified;
      const isPhoneVerified =
        data?.user?.isPhoneVerified || data?.isPhoneVerified;
      const userPhone = data?.user?.phone || data?.phone;
      const isPasswordResetRequired =
        data?.user?.isPasswordResetRequired || data?.isPasswordResetRequired || false;
      const userEmail = data?.user?.email || data?.email || this.email;
      const isOffBoarded = data?.isOffBoarded || false;

      if (isOffBoarded) {
        this.lastRemark = data?.lastRemark;
        this.showReactivateDialog = true;
        return;
      }


      // CASE 0: Password reset required - redirect to forgot password page
      if (isPasswordResetRequired) {
        this.$snackbar.showError(
          "Password reset required. Please reset your password to continue."
        );
        setTimeout(() => {
          this.$router.push({
            name: "forgot-password",
            params: { email: userEmail, resetRequired: true },
          });
        }, 1500);
        return;
      }

      // Only proceed with verification checks if password reset is NOT required
      if (!isPasswordResetRequired) {
        // CASE A: Both email and phone are verified
        if (isEmailVerified && isPhoneVerified) {
          if (!userEmail) {
            this.$snackbar.showError(
              "Email not found. Please contact support."
            );
            return;
          }

          // If it's a spouse login (has parentId), allow direct login to profile skipping the 2FA OTP
          const isSpouse = !!(data?.user?.parentId || data?.parentId);
          if (isSpouse) {
            this.proceedWithDirectLogin(response);
            return;
          }

          try {
            // Call email verify API to initiate OTP process (for normal login flow)
            const verifyResponse = await this.submitData(
              "/users/auth/email/verify",
              { email: userEmail }
            );

            // Check if OTP was sent successfully
            if (verifyResponse.success || verifyResponse.status === 200) {
              // Show success message (backend-provided only when available)
              try {
                if (
                  this.$snackbar &&
                  typeof this.$snackbar.showApiSuccess === "function"
                ) {
                  this.$snackbar.showApiSuccess(
                    verifyResponse || {
                      message:
                        "OTP sent to your email. Please verify to continue.",
                    }
                  );
                } else {
                  this.$snackbar.showSuccess(
                    verifyResponse.message ||
                    "OTP sent to your email. Please verify to continue."
                  );
                }
              } catch (e) {
                this.$snackbar.showSuccess(
                  verifyResponse.message ||
                  "OTP sent to your email. Please verify to continue."
                );
              }

              // Redirect to email verification page for normal login (both verified flow)
              setTimeout(() => {
                // Indicate that OTP was already sent and this is normal login flow
                this.$router.push({
                  name: "signinPhoneVerify",
                  query: { 
                    email: userEmail,
                    phone: userPhone, 
                    otpSent: true,
                    normalLogin: true  // Flag to indicate both are verified, email OTP only
                  },
                });
              }, 1000);
            } else {
              // Handle OTP send failure — show backend message only
              try {
                if (
                  this.$snackbar &&
                  typeof this.$snackbar.showApiError === "function"
                ) {
                  this.$snackbar.showApiError(
                    verifyResponse || {
                      error: "Failed to send OTP. Please try again.",
                    }
                  );
                } else {
                  this.$snackbar.showError(
                    verifyResponse.message ||
                    "Failed to send OTP. Please try again."
                  );
                }
              } catch (e) {
                this.$snackbar.showError(
                  verifyResponse.message ||
                  "Failed to send OTP. Please try again."
                );
              }
            }
          } catch (error) {
            console.error("Phone verify API failed:", error);
            this.$snackbar.showError(
              error.message || "Unable to verify phone. Please try again."
            );
          }
        }
        // CASE B: Either email or phone is not verified
        else if (!isEmailVerified || !isPhoneVerified) {
          let message = "User not verified";
          if (!isEmailVerified && !isPhoneVerified) {
            message = "Email and phone verification required";
          } else if (!isEmailVerified) {
            message = "Email verification required";
          } else if (!isPhoneVerified) {
            message = "Phone verification required";
          }

          this.$snackbar.showError(message);

          // Build query parameters for OTP verification page
          const queryParams = {
            email: userEmail,
            phone: userPhone,
          };

          // Add spouse information if available
          const spouse = data?.user?.spouse || data?.spouse;
          if (spouse) {
            queryParams.spouseEmail = spouse.email;
            queryParams.spousePhone = spouse.phone;
            queryParams.spouseExists = true;
          }

          // Redirect to OTP verification page
          setTimeout(() => {
            this.$router.push({
              name: "otp-verify",
              query: queryParams,
            });
          }, 1500);
        }
        // Fallback case - proceed with normal login (shouldn't reach here based on logic)
        else {
          this.proceedWithDirectLogin(response);
        }
      }
    },
    proceedWithDirectLogin(response) {
      try {
        if (
          this.$snackbar &&
          typeof this.$snackbar.showApiSuccess === "function"
        ) {
          this.$snackbar.showApiSuccess(
            response || { message: "Login successful!" }
          );
        } else {
          this.$snackbar.showSuccess(response.message || "Login successful!");
        }
      } catch (e) {
        this.$snackbar.showSuccess(response.message || "Login successful!");
      }
      this.$store.dispatch("loginUser", {
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        userRole: response.data.role || response.data.user?.role || "user",
        userName: response.data.name || response.data.user?.name,
        userId: response.data.id || response.data.user?.id,
      });

      // Initialize FCM and send token after successful login
      this.initializeFCMAfterLogin();
    },

    async initializeFCMAfterLogin() {
      try {
        console.log("Initializing FCM after login...");
        const fcmToken = await FCMService.initialize();
        if (fcmToken) {
          console.log("FCM token generated and sent to server after login");
        }
      } catch (error) {
        console.error("Error initializing FCM after login:", error);
      }
    },

    resetForm() {
      this.email = null;
      this.password = null;
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

.loginhead {
  font-family: DMSans;
  font-weight: 700;
  font-size: 30px;
  color: #292727;
}

@media (max-width: 600px) {
  .loginhead {
    font-size: 20px;
  }
}

.loginsubhead {
  font-family: DMSans;
  font-weight: 500;
  font-size: 18px;
  color: #28272996;
}

@media (max-width: 600px) {
  .loginsubhead {
    font-size: 15px;
  }
}

.loginbtn {
  font-family: DMSans;
  font-weight: 500;
  font-size: 16px;
  color: #ffffff;
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

.frgtpass {
  font-family: DMSans;
  font-weight: 500;
  font-size: 15px;
  color: #104790;
  text-decoration: underline;
  cursor: pointer;
}

.otpsubhead {
  font-family: DMSans;
  font-weight: 400;
  font-size: 15px;
  color: #28272996;
}

.otpsubsubhead {
  font-family: DMSans;
  font-weight: 400;
  font-size: 15px;
  color: red;
}
</style>

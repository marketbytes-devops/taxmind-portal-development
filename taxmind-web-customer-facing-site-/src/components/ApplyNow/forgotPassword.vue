<template>
  <div>
    <!-- Global snackbar mounted in App.vue; use this.$snackbar.showSuccess()/showError() -->
    <v-layout wrap justify-center>
      <v-flex xs12>
        <v-layout wrap justify-center> </v-layout>
        <v-layout wrap justify-center fill-height mt-6 mt-lg-8 mt-md-8 mt-sm-6 pt-14>
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
                        <v-flex xs12 text-start pt-1 v-if="!emailSubmitted">
                          <span class="loginhead">
                            {{ resetRequired ? 'Reset Password Required' : 'Forgot Password ?' }}
                          </span>
                        </v-flex>
                        <v-flex xs12 lg11 text-start pt-2 v-if="!emailSubmitted && resetRequired">
                          <span class="otpsubsubhead">
                            For security reasons, you must reset your password before continuing.
                          </span>
                        </v-flex>
                        <v-flex xs4 lg2 md2 sm3 v-if="!emailSubmitted"><v-progress-linear
                            value="100"></v-progress-linear></v-flex>
                        <v-flex xs12 lg11 pt-3 v-if="!emailSubmitted">
                          <v-text-field v-model="email" class="rounded-lg pt-1" solo dense placeholder="Email Address"
                            outlined flat hide-details :disabled="resetRequired" style="font-family: DMSans">
                          </v-text-field>
                        </v-flex>
                        <v-flex xs12 lg11 pb-1 pt-5 text-center v-if="!emailSubmitted">
                          <v-btn @click="verifyInput" color="#1A73E9" class="rounded-lg" block>
                            <span class="loginbtn">Submit</span>
                          </v-btn>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-center>
                        <v-flex xs12 text-left pt-3 v-if="emailSubmitted">
                          <span class="otpsubhead">A 6-digit OTP has been sent to {{ email }}</span>
                        </v-flex>
                        <v-flex xs12 lg8 text-left pt-3 v-if="emailSubmitted">
                          <v-layout wrap justify-center>
                            <v-flex xs12 text-center>
                              <div class="otp-input-row">
                                <input v-for="(digit, index) in otpArray" :key="`otp-${index}`"
                                  v-model="otpArray[index]" :ref="`otpInput${index}`" class="otp-input-figma" type="tel"
                                  inputmode="numeric" pattern="[0-9]*" maxlength="1"
                                  @input="handleOtpInput(index, $event)" @keydown="handleKeyDown(index, $event)"
                                  @paste="handlePaste($event)" />
                              </div>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                        <!-- Password Fields -->
                        <v-flex xs12 lg12 text-start pt-4 v-if="emailSubmitted">
                          <span class="passsubhead">Enter a strong password with at least 8 characters,
                            including a mix of letters, numbers, and
                            symbols</span>
                        </v-flex>
                        <v-flex xs12 lg11 pt-3 v-if="emailSubmitted">
                          <v-text-field v-model="newPassword" class="rounded-lg pt-1" :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'
                            " :type="showPassword ? 'text' : 'password'" @click:append="showPassword = !showPassword"
                            solo dense placeholder="New Password" outlined flat hide-details
                            style="font-family: DMSans">
                          </v-text-field>
                        </v-flex>
                        <v-flex xs12 lg11 pt-3 v-if="emailSubmitted">
                          <v-text-field v-model="confirmnewPassword" class="rounded-lg pt-1" :append-icon="showconfirmPassword ? 'mdi-eye' : 'mdi-eye-off'
                            " :type="showconfirmPassword ? 'text' : 'password'" @click:append="
                              showconfirmPassword = !showconfirmPassword
                              " solo dense placeholder="Confirm Password" outlined flat hide-details
                            style="font-family: DMSans">
                          </v-text-field>
                        </v-flex>
                        <v-flex xs12 lg12 pb-1 pt-5 text-center v-if="emailSubmitted">
                          <v-btn @click="resetPassword" color="#1A73E9" class="rounded-lg" block :loading="appLoading">
                            <span class="loginbtn">RESET PASSWORD</span>
                          </v-btn>
                        </v-flex>
                        <!-- Resend OTP option -->
                        <v-flex xs12 text-center pt-3 v-if="emailSubmitted">
                          <span class="otpsubhead">Didn't receive the OTP?
                          </span>
                          <span class="otpresend" @click="resendOTP"
                            style="cursor: pointer; text-decoration: underline">
                            Resend
                          </span>
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
      // Local snackbar removed; use this.$snackbar
      showPassword: false,
      showconfirmPassword: false,
      timeout: 5000,
      emailSubmitted: false,
      email: null,
      otp: null,
      otpArray: ["", "", "", "", "", ""],
      newPassword: null,
      confirmnewPassword: null,
      resetRequired: false, // Flag to identify if password reset is required
    };
  },
  mounted() {
    // Check if email is passed via route params (from password reset required flow)
    if (this.$route.params.email) {
      this.email = this.$route.params.email;
      this.resetRequired = this.$route.params.resetRequired || false;
    }
  },
  methods: {
    verifyInput() {
      if (!this.email) {
        this.$snackbar.showError("Please provide email address");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.$snackbar.showError("Please provide a valid email address");
        return;
      }

      this.forgotPassword();
    },
    validatePasswordReset() {
      if (!this.isOtpComplete()) {
        this.$snackbar.showError("Please enter the 6-digit OTP");
        return false;
      }

      if (!this.newPassword) {
        this.$snackbar.showError("Please enter new password");
        return false;
      }

      if (this.newPassword.length < 8) {
        this.$snackbar.showError("Password must be at least 8 characters long");
        return false;
      }

      if (!this.confirmnewPassword) {
        this.$snackbar.showError("Please confirm your password");
        return false;
      }

      if (this.newPassword !== this.confirmnewPassword) {
        this.$snackbar.showError(
          "New password and confirm password do not match"
        );
        return false;
      }

      // Password strength validation
      const passwordRegex =
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(this.newPassword)) {
        this.$snackbar.showError(
          "Password must contain letters, numbers, and symbols"
        );
        return false;
      }

      return true;
    },
    async resetPassword() {
      if (!this.validatePasswordReset()) {
        return;
      }

      try {
        this.appLoading = true;

        const payload = {
          email: this.email,
          otp: parseInt(this.otp),
          newPassword: this.newPassword,
        };

        const response = await this.submitData(
          "/users/auth/password/reset",
          payload
        );

        if (response.success || response.status === 200) {
          try {
            this.$snackbar.showSuccess(
              response?.message || "Password reset successfully"
            );
          } catch (e) {
            this.$snackbar.showSuccess(
              response.message || "Password reset successfully"
            );
          }

          // Clear form and redirect to login after 2 seconds
          setTimeout(() => {
            this.resetForm();
            this.$router.push({ name: "login" });
          }, 2000);
        } else {
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              this.$snackbar.showApiError(
                response || { error: "Failed to reset password" }
              );
            } else {
              this.$snackbar.showError(
                response.message || "Failed to reset password"
              );
            }
          } catch (e) {
            this.$snackbar.showError(
              response.message || "Failed to reset password"
            );
          }
        }
      } catch (error) {
        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            this.$snackbar.showApiError(
              error || { error: "Password reset failed. Please try again." }
            );
          } else {
            this.$snackbar.showError(
              "Password reset failed. Please try again."
            );
          }
        } catch (e) {
          this.$snackbar.showError("Password reset failed. Please try again.");
        }
      } finally {
        this.appLoading = false;
      }
    },
    async forgotPassword() {
      try {
        const payload = {
          email: this.email,
        };

        // Using TAXMIND.json endpoint: /users/auth/email/verify (same as email verification)
        const response = await this.submitData(
          "/users/auth/email/verify",
          payload
        );

        if (
          response.success ||
          response.status === 200 ||
          response.status === true
        ) {
          try {
            this.$snackbar.showSuccess(
              response?.message || "OTP sent successfully"
            );
          } catch (e) {
            this.$snackbar.showSuccess(
              response.message || "OTP sent successfully"
            );
          }
          this.emailSubmitted = true;
        } else {
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              this.$snackbar.showApiError(
                response || { error: "Failed to send OTP" }
              );
            } else {
              this.$snackbar.showError(
                response.message || "Failed to send OTP"
              );
            }
          } catch (e) {
            this.$snackbar.showError(response.message || "Failed to send OTP");
          }
        }
      } catch (error) {
        console.error("Send forgot password OTP failed:", error);
        // ApiMigrationMixin handles error display automatically
      }
    },
    handleOtpInput(index, event) {
      let value = event.target.value;

      // Only allow numeric digits
      value = value.replace(/[^0-9]/g, "");

      // Take only the last digit if multiple characters
      if (value.length > 1) {
        value = value.slice(-1);
      }

      // Update the input value and array
      event.target.value = value;
      this.otpArray[index] = value;

      // Update otp string for API call
      this.otp = this.otpArray.join("");

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = this.$refs[`otpInput${index + 1}`];
        if (nextInput && nextInput[0]) {
          nextInput[0].focus();
        }
      }
    },

    handleKeyDown(index, event) {
      // Handle backspace to move to previous input
      if (event.key === "Backspace" && !this.otpArray[index] && index > 0) {
        const prevInput = this.$refs[`otpInput${index - 1}`];
        if (prevInput && prevInput[0]) {
          prevInput[0].focus();
        }
      }
    },

    handlePaste(event) {
      event.preventDefault();
      const pastedData = event.clipboardData.getData("text");
      const digits = pastedData.replace(/[^0-9]/g, "").slice(0, 6);

      for (let i = 0; i < digits.length && i < 6; i++) {
        this.otpArray[i] = digits[i];
        const input = this.$refs[`otpInput${i}`];
        if (input && input[0]) {
          input[0].value = digits[i];
        }
      }

      // Update otp string
      this.otp = this.otpArray.join("");

      // Focus the next empty input or the last one
      const nextEmptyIndex = this.otpArray.findIndex((digit) => digit === "");
      const focusIndex =
        nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(digits.length, 5);
      const targetInput = this.$refs[`otpInput${focusIndex}`];
      if (targetInput && targetInput[0]) {
        targetInput[0].focus();
      }
    },

    isOtpComplete() {
      return this.otpArray.every((digit) => digit !== "");
    },

    clearOtp() {
      this.otpArray = ["", "", "", "", "", ""];
      this.otp = null;
    },

    focusFirstOtpInput() {
      setTimeout(() => {
        const firstInput = this.$refs.otpInput0;
        if (firstInput && firstInput[0]) {
          firstInput[0].focus();
        }
      }, 100);
    },

    async resendOTP() {
      this.clearOtp();
      await this.forgotPassword();
      this.focusFirstOtpInput();
    },

    resetForm() {
      this.email = null;
      this.otp = null;
      this.otpArray = ["", "", "", "", "", ""];
      this.newPassword = null;
      this.confirmnewPassword = null;
      this.emailSubmitted = false;
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
  font-size: 25px;
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
}

.otpsubhead {
  font-family: DMSans;
  font-weight: 400;
  font-size: 15px;
  color: #28272996;
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

/* Custom OTP Input Styles - Matching otpPage.vue */
.otp-input-row {
  display: flex;
  gap: clamp(8px, 3vw, 36px);
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  flex-wrap: nowrap;
  width: 100%;
  max-width: 100%;
}

.otp-input-figma {
  width: clamp(35px, 8vw, 46px);
  height: clamp(35px, 8vw, 46px);
  background: white;
  border: 1.095px solid rgba(0, 0, 0, 0.1);
  border-radius: 0;
  text-align: center;
  font-family: "DM Sans", sans-serif;
  font-size: clamp(14px, 3.5vw, 18px);
  font-weight: 600;
  color: black;
  outline: none;
  transition: border-color 0.2s ease;
  flex-shrink: 0;
}

.otp-input-figma:focus {
  border-color: #1a73e9;
  box-shadow: 0 0 0 1px #1a73e9;
}

.otp-input-figma:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: rgba(0, 0, 0, 0.05);
}

/* Extra small mobile devices (320px - 374px) */
@media (max-width: 374px) {
  .otp-input-row {
    gap: 6px;
    padding: 8px 0;
  }

  .otp-input-figma {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}

/* Small mobile devices (375px - 599px) */
@media (min-width: 375px) and (max-width: 599px) {
  .otp-input-row {
    gap: 10px;
  }

  .otp-input-figma {
    width: 38px;
    height: 38px;
    font-size: 15px;
  }
}

/* Tablets (600px - 959px) */
@media (min-width: 600px) and (max-width: 959px) {
  .otp-input-row {
    gap: 10px;
  }

  .otp-input-figma {
    width: 42px;
    height: 42px;
    font-size: 17px;
  }
}

/* Desktop and larger (960px+) */
@media (min-width: 960px) {
  .otp-input-row {
    gap: 10px;
  }

  .otp-input-figma {
    width: 46px;
    height: 46px;
    font-size: 18px;
  }
}
</style>

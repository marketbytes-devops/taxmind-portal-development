<template>
  <div class="otp-verification-container">
    <!-- Global snackbar is mounted in App.vue and available as this.$snackbar -->

    <v-card class="verification-layout pa-8" elevation="0">
      <!-- Phone Verification Layout -->
      <v-layout column align-center class="verification-layout-container">
        <div class="verification-row single-row mb-4">
          <v-layout row wrap class="row-layout">
            <v-flex xs12 class="verification-flex">
              <!-- Email OTP Verification Card -->
              <v-card class="verification-card" height="220" width="540" outlined>
                <v-card-text class="card-content">
                  <div class="card-header">
                    <h3 class="verification-title">Verify Your Email</h3>
                    <div class="verification-subtitle">
                      <p class="mb-0">
                        A one-time password has been sent to your email
                      </p>
                      <p>{{ emailAddress }}</p>
                    </div>
                  </div>
                  <div class="otp-input-row">
                    <input v-for="(digit, index) in emailOtp" :key="`email-${index}`" v-model="emailOtp[index]"
                      :ref="`emailInput${index}`" class="otp-input-figma"
                      :class="{ 'otp-input-disabled': emailVerified }" :disabled="emailVerified" type="text"
                      maxlength="1" @input="handleOtpInput(index, $event)" @keydown="handleKeyDown(index, $event)" />
                  </div>
                  <div class="timer-resend-row">
                    <!-- keep the timer element in the layout to avoid shifting the Resend button -->
                    <span class="timer-text">
                      <span :class="{ 'timer-empty': !formatTime(emailTimer) }">
                        {{ formatTime(emailTimer) || "0:00" }}
                        <span class="timer-unit">s</span>
                      </span>
                    </span>
                    <button class="resend-text" :disabled="emailTimer > 0 || emailVerified" @click="resendOtp">
                      {{ emailVerified ? "Verified" : "Resend" }}
                    </button>
                  </div>

                  <!-- spacing below timer/resend -->
                  <div class="pb-4"></div>
                </v-card-text>
              </v-card>
            </v-flex>
          </v-layout>
        </div>

        <!-- Verify Button removed: auto-verification is handled when OTP is completed -->
      </v-layout>
    </v-card>

    <!-- Zoho signature consent popup (persistent) -->
    <ZohoSignPopup v-model="showZohoPopup" @login="onZohoLogin" />
  </div>
</template>

<script>
import { ApiMigrationMixin } from "@/utils/apiMigration";
import ZohoSignPopup from "@/components/Common/ZohoSignPopup.vue";

export default {
  name: "SigninPhoneVerify",
  mixins: [ApiMigrationMixin],
  components: {
    ZohoSignPopup,
  },
  metaInfo: {
    title: "Verify Email Address - TaxMind",
    meta: [
      {
        name: "description",
        content:
          "Verify your email address to complete the sign-in process for TaxMind tax refund services.",
      },
    ],
  },
  data() {
    return {
      // Local snackbar removed; use this.$snackbar.showSuccess()/showError()
      emailAddress: "",
      emailOtp: ["", "", "", "", "", ""],
      emailTimer: 60, // 1 minute
      emailVerified: false,
      verifying: false,
      timerInterval: null,
      otpSent: false,
      sendingOtp: false,
      showZohoPopup: false,
    };
  },
  computed: {
    isOtpComplete() {
      return this.emailOtp.every((digit) => digit.trim() !== "");
    },
  },
  async mounted() {
    // Get email address from route query
    this.emailAddress = this.$route.query.email || "";

    // If navigated from login flow with otpSent flag, don't resend on mount
    if (this.$route.query.otpSent) {
      this.otpSent = true;
      // Still start timer and focus input as OTP was sent by previous page
      this.startTimer();
      this.focusFirstInput();
      return;
    }

    if (!this.emailAddress) {
      this.$snackbar.showError(
        "Email address not provided. Redirecting to login..."
      );
      setTimeout(() => {
        this.$router.push({ name: "login" });
      }, 2000);
      return;
    }

    // Send OTP automatically when component mounts (if not already sent)
    if (!this.otpSent) {
      await this.sendEmailOtp();
      this.otpSent = true;
    }
  },
  beforeDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },
  methods: {
    async sendEmailOtp() {
      // prevent duplicate sends
      if (this.sendingOtp) return;
      this.sendingOtp = true;
      try {
        const payload = { email: this.emailAddress };

        const response = await this.submitData(
          "/users/auth/email/verify",
          payload
        );

        // Start timer
        this.startTimer();

        // Focus on first input
        this.focusFirstInput();

        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            // showApiError handles both success and error-like payloads; for success, call showSuccess
            this.$snackbar.showSuccess(
              response?.message || "OTP sent to your email successfully"
            );
          } else {
            this.$snackbar.showSuccess(
              response.message || "OTP sent to your email successfully"
            );
          }
        } catch (e) {
          this.$snackbar.showSuccess(
            response.message || "OTP sent to your email successfully"
          );
        }
      } catch (error) {
        console.error("Send email OTP failed:", error);
        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            this.$snackbar.showApiError(
              error || { error: "Failed to send OTP. Please try again." }
            );
          } else {
            try {
              this.$snackbar.showError(error?.response?.data?.message || "");
            } catch (e) {
              this.$snackbar.showError("");
            }
          }
        } catch (e) {
          try {
            this.$snackbar.showError(error?.response?.data?.message || "");
          } catch (ee) {
            this.$snackbar.showError("");
          }
        }

        // Start timer even on error to allow resend
        this.startTimer();
      } finally {
        this.sendingOtp = false;
        this.otpSent = true;
      }
    },

    async verifyEmailOtp() {
      if (!this.isOtpComplete) {
        this.$snackbar.showError("Please enter the complete OTP");
        return;
      }

      try {
        this.verifying = true;
        const otpString = this.emailOtp.join("");
        const payload = {
          email: this.emailAddress,
          otp: otpString,
        };

        const response = await this.submitData(
          "/users/auth/email/verify/confirm",
          payload
        );

        if (response.success || response.status === 200) {
          this.emailVerified = true;
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              // For successes, prefer showSuccess but still display backend message if present
              this.$snackbar.showSuccess(
                response?.message || "Email verified successfully"
              );
            } else {
              this.$snackbar.showSuccess(
                response.message || "Email verified successfully"
              );
            }
          } catch (e) {
            this.$snackbar.showSuccess(
              response.message || "Email verified successfully"
            );
          }

          // Extract tokens from response and save them
          // Check signature consent status
          const sigCompleted =
            response.data && response.data.isSignatureConsentCompleted;
          if (sigCompleted === true) {
            // proceed with existing success flow
            if (
              response.data &&
              (response.data.accessToken || response.data.refreshToken)
            ) {
              await this.handleVerificationSuccess(response.data);
            } else {
              // If no tokens in response, show success and redirect to login
              this.$snackbar.showSuccess(
                "Phone verified successfully. Please login again to continue."
              );
              setTimeout(() => {
                this.$router.push({ name: "login" });
              }, 2000);
            }
          } else if (sigCompleted === false) {
            // show non-dismissible ZohoSignPopup
            this.showZohoPopup = true;
          } else {
            // If signature flag not present, fallback to normal flow
            if (
              response.data &&
              (response.data.accessToken || response.data.refreshToken)
            ) {
              await this.handleVerificationSuccess(response.data);
            } else {
              this.$snackbar.showSuccess(
                "Phone verified successfully. Please login again to continue."
              );
              setTimeout(() => {
                this.$router.push({ name: "login" });
              }, 2000);
            }
          }
        } else {
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              this.$snackbar.showApiError(
                response || { error: "Invalid OTP. Please try again." }
              );
            } else {
              this.$snackbar.showError(
                response.message || "Invalid OTP. Please try again."
              );
            }
          } catch (e) {
            this.$snackbar.showError(
              response.message || "Invalid OTP. Please try again."
            );
          }
        }
      } catch (error) {
        console.error("Email OTP verification failed:", error);
        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            this.$snackbar.showApiError(
              error || { error: "Verification failed. Please try again." }
            );
          } else {
            try {
              this.$snackbar.showError(error?.response?.data?.message || "");
            } catch (e) {
              this.$snackbar.showError("");
            }
          }
        } catch (e) {
          try {
            this.$snackbar.showError(error?.response?.data?.message || "");
          } catch (ee) {
            this.$snackbar.showError("");
          }
        }
      } finally {
        this.verifying = false;
      }
    },

    async handleVerificationSuccess(data) {
      try {
        // Save tokens using setToken and setRefreshToken pattern (as per requirements)
        this.setToken(data.accessToken);
        this.setRefreshToken(data.refreshToken);

        // Update Vuex store with skipNavigation to prevent automatic routing
        this.$store.dispatch("loginUser", {
          token: data.accessToken,
          refreshToken: data.refreshToken,
          userRole: data.role || data.user?.role || "user",
          userName: data.name || data.user?.name || "",
          userId: data.id || data.user?.id || "",
          skipNavigation: true, // Prevent automatic navigation
        });

        // Navigate to profile manually using path (same as store)
        setTimeout(() => {
          this.$router
            .push("/profile")
            .then(() => { })
            .catch((err) => {
              console.error("❌ Navigation failed:", err);
            });
        }, 1500);
      } catch (error) {
        console.error("Error handling verification success:", error);
        this.$snackbar.showError(
          "Verification successful, but failed to login. Please login again."
        );
        setTimeout(() => {
          this.$router.push({ name: "login" });
        }, 2000);
      }
    },

    // Token management methods (following admin panel pattern)
    setToken(token) {
      if (token) {
        localStorage.setItem("accesstoken", token);
      }
    },

    setRefreshToken(refreshToken) {
      if (refreshToken) {
        localStorage.setItem("refreshtoken", refreshToken);
      }
    },

    async resendOtp() {
      // Clear current OTP
      this.emailOtp = ["", "", "", "", "", ""];

      // Send new OTP
      await this.sendEmailOtp();
    },

    startTimer() {
      this.emailTimer = 60; // Reset to 1 minute

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        this.emailTimer--;
        if (this.emailTimer <= 0) {
          clearInterval(this.timerInterval);
        }
      }, 1000);
    },

    formatTime(seconds) {
      if (seconds <= 0) return "";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      // minutes unpadded (e.g., 0,1,2) but seconds always 2 digits
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },

    handleOtpInput(index, event) {
      const value = event.target.value;

      // Only allow digits
      if (!/^\d$/.test(value) && value !== "") {
        event.target.value = "";
        this.emailOtp[index] = "";
        return;
      }

      this.emailOtp[index] = value;

      // Auto-focus next input
      if (value !== "" && index < 5) {
        const nextInput = this.$refs[`emailInput${index + 1}`];
        if (nextInput && nextInput[0]) {
          nextInput[0].focus();
        }
      }

      // Auto-verify when all digits are entered
      if (this.isOtpComplete) {
        // Small delay to ensure UI updates
        setTimeout(() => {
          if (this.isOtpComplete && !this.emailVerified) {
            this.verifyEmailOtp();
          }
        }, 100);
      }
    },

    handleKeyDown(index, event) {
      // Handle backspace
      if (event.key === "Backspace") {
        if (this.emailOtp[index] === "" && index > 0) {
          const prevInput = this.$refs[`emailInput${index - 1}`];
          if (prevInput && prevInput[0]) {
            prevInput[0].focus();
          }
        }
      }
      // Handle arrow keys
      else if (event.key === "ArrowLeft" && index > 0) {
        const prevInput = this.$refs[`emailInput${index - 1}`];
        if (prevInput && prevInput[0]) {
          prevInput[0].focus();
        }
      } else if (event.key === "ArrowRight" && index < 5) {
        const nextInput = this.$refs[`emailInput${index + 1}`];
        if (nextInput && nextInput[0]) {
          nextInput[0].focus();
        }
      }
    },

    focusFirstInput() {
      this.$nextTick(() => {
        const firstInput = this.$refs.emailInput0;
        if (firstInput && firstInput[0]) {
          firstInput[0].focus();
        }
      });
    },
    // Handler for ZohoSignPopup login click
    onZohoLogin() {
      // Clear user session completely
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshtoken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");

      // Close the popup (though it's persistent) and redirect to login
      this.showZohoPopup = false;
      this.$router.push({ name: "login" });
    },
  },
};
</script>

<style scoped>
/* Import styles from otpPage.vue */

/* Verification Grid Styles */
.verification-layout-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* gap: 24px; */
}

.verification-row {
  width: 100%;
  max-width: 1100px;
}

.row-layout {
  width: 100%;
  justify-content: center;
}

.verification-flex {
  display: flex;
  justify-content: center;
}

.single-row .verification-flex {
  justify-content: center;
}

/* Verification Card Styles */
.verification-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.verification-card:hover {
  border-color: #1a73e9;
  box-shadow: 0 4px 12px rgba(26, 115, 233, 0.1);
}

.card-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.card-header {
  text-align: center;
  margin-bottom: 16px;
}

.verification-title {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.verification-subtitle {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
  line-height: 1.4;
}

.verification-subtitle p {
  margin: 2px 0;
}

/* OTP Input Styles */
.otp-input-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 16px 0;
}

.otp-input-figma {
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  text-align: center;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #1a1a1a;
  background: white;
  transition: all 0.2s ease;
  outline: none;
}

.otp-input-figma:focus {
  border-color: #1a73e9;
  box-shadow: 0 0 0 3px rgba(26, 115, 233, 0.1);
}

.otp-input-figma:hover {
  border-color: #9ca3af;
}

.otp-input-disabled {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
}

/* Timer and Resend Styles */
.timer-resend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin-top: 12px; */
  margin-bottom: 12px;
}

.timer-text {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  /* bolder */
  font-size: 14px;
  color: #1a73e9;
  /* active blue */
}

.timer-unit {
  font-size: 12px;
  color: #1a73e9;
  margin-left: 4px;
}

.timer-text {
  /* ensure the timer column always keeps space to avoid shifting the Resend button */
  min-width: 56px;
  /* enough for '0:00 s' */
  display: inline-block;
}

.timer-empty {
  visibility: hidden;
  /* keep space but hide content */
}

.resend-text {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  /* slightly bolder */
  font-size: 14px;
  color: #1a73e9;
  /* active blue */
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: color 0.2s ease;
}

.resend-text:hover:not(:disabled) {
  color: #0f5fc7;
}

.resend-text:disabled {
  color: #9ca3af;
  cursor: not-allowed;
  text-decoration: none;
}

/* Button Styles */
.next-button-container {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 1100px;
  margin-top: 24px;
}

.next-btn {
  width: 179px;
  height: 40px;
  border-radius: 8px;
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 16px;
  text-transform: none;
  color: white !important;
}

.next-btn:disabled {
  opacity: 0.5;
}

/* Base Container Styles */
.otp-verification-container {
  min-height: 100vh;
  background: white;
  padding: 50px;
  box-sizing: border-box;
  margin-top: 20px;
}

.verification-layout {
  max-width: 1200px;
  margin: 90px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .otp-verification-container {
    padding: 20px;
  }

  .next-button-container {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .verification-card {
    width: 100% !important;
    max-width: 400px;
  }

  .verification-title {
    font-size: 16px;
  }

  .verification-subtitle {
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .otp-verification-container {
    padding: 30px 15px;
  }

  .otp-input-figma {
    width: 35px;
    height: 35px;
    font-size: 14px;
  }

  .otp-input-row {
    gap: 6px;
  }
}
</style>

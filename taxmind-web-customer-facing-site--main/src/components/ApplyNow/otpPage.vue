<template>
  <div class="otp-verification-container">
    <!-- snackbar moved to GlobalSnackbar; use this.$snackbar.showSuccess/showError -->

    <v-card class="verification-layout pa-4" elevation="0">
      <!-- Dynamic OTP Verification Grid -->
      <v-layout column align-center class="verification-layout-container">
        <!-- Dynamic Grid Layout based on activeOtpBlocks -->
        <div v-for="(row, rowIndex) in gridConfig.rows" :key="`row-${rowIndex}`" class="verification-row" :class="{
          'mb-4': rowIndex < gridConfig.rows.length - 1,
          'single-row': row.blocks.length === 1,
          'dual-row': row.blocks.length === 2,
        }">
          <v-layout row wrap class="row-layout">
            <v-flex v-for="(blockType, blockIndex) in row.blocks" :key="`${blockType}-${blockIndex}`" :class="{
              xs12: row.widths[blockIndex] === 'full',
              'xs12 sm6': row.widths[blockIndex] === 'half',
              'pr-2':
                row.widths[blockIndex] === 'half' &&
                blockIndex === 0 &&
                row.blocks.length === 2,
              'pl-2': row.widths[blockIndex] === 'half' && blockIndex === 1,
              'pr-2':
                row.widths[blockIndex] === 'half' && row.blocks.length === 1,
            }" class="verification-flex">
              <!-- User Email OTP Block -->
              <v-card v-if="blockType === 'userEmail'" class="verification-card" height="220"
                :width="row.widths[blockIndex] === 'full' ? '540' : null" outlined>
                <v-card-text class="card-content">
                  <div class="card-header">
                    <h3 class="verification-title">Verify Your Email</h3>
                    <div class="verification-subtitle">
                      <p class="mb-0">
                        A one-time password has been sent to your email
                      </p>
                      <p>{{ userEmail }}</p>
                    </div>
                  </div>
                  <div class="otp-input-row">
                    <input v-for="(digit, index) in userEmailOtp" :key="`user-email-${index}`"
                      v-model="userEmailOtp[index]" :ref="`userEmailInput${index}`" class="otp-input-figma"
                      :class="{ 'otp-input-disabled': userEmailVerified || !userPhoneVerified }" :disabled="userEmailVerified || !userPhoneVerified" type="text"
                      maxlength="1" @input="handleOtpInput('userEmail', index, $event)"
                      @keydown="handleKeyDown('userEmail', index, $event)" />
                  </div>
                  <div class="timer-resend-row" v-if="!userEmailVerified">
                    <span class="timer-text">
                      <span :class="{ 'timer-empty': !formatTime(userEmailTimer) }">
                        {{ formatTime(userEmailTimer) || "0:00" }}
                        <span class="timer-unit">s</span>
                      </span>
                    </span>
                    <button class="resend-text" :disabled="userEmailTimer > 0 || userEmailVerified || !userPhoneVerified"
                      @click="resendOtp('userEmail')">
                      {{ userEmailVerified ? "Verified" : "Resend" }}
                    </button>
                  </div>
                </v-card-text>
              </v-card>

              <!-- User Phone OTP Block -->
              <v-card v-else-if="blockType === 'userPhone'" class="verification-card" height="220"
                :width="row.widths[blockIndex] === 'full' ? '540' : null" outlined>
                <v-card-text class="card-content">
                  <div class="card-header">
                    <h3 class="verification-title">Verify Your Phone</h3>
                    <div class="verification-subtitle">
                      <p class="mb-0">
                        A one-time password has been sent to your phone
                      </p>
                      <p>{{ userPhone }}</p>
                    </div>
                  </div>
                  <div class="otp-input-row">
                    <input v-for="(digit, index) in userPhoneOtp" :key="`user-phone-${index}`"
                      v-model="userPhoneOtp[index]" :ref="`userPhoneInput${index}`" class="otp-input-figma" :class="{
                        'otp-input-disabled': userPhoneVerified,
                      }" :disabled="userPhoneVerified" type="text" maxlength="1"
                      @input="handleOtpInput('userPhone', index, $event)"
                      @keydown="handleKeyDown('userPhone', index, $event)" />
                  </div>
                  <div class="timer-resend-row" v-if="!userPhoneVerified">
                    <span class="timer-text">
                      <span :class="{ 'timer-empty': !formatTime(userPhoneTimer) }">
                        {{ formatTime(userPhoneTimer) || "0:00" }}
                        <span class="timer-unit">s</span>
                      </span>
                    </span>
                    <button class="resend-text" :disabled="userPhoneTimer > 0 ||
                      userPhoneVerified
                      " @click="resendOtp('userPhone')">
                      {{ userPhoneVerified ? "Verified" : "Resend" }}
                    </button>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Spouse Email OTP Block -->
              <v-card v-else-if="blockType === 'spouseEmail'" class="verification-card" height="220"
                :width="row.widths[blockIndex] === 'full' ? '540' : null" outlined>
                <v-card-text class="card-content">
                  <div class="card-header">
                    <h3 class="verification-title">Verify Spouse Email</h3>
                    <div class="verification-subtitle">
                      <p class="mb-0">
                        A one-time password has been sent to your email
                      </p>
                      <p>{{ spouseEmail }}</p>
                    </div>
                  </div>
                  <div class="otp-input-row">
                    <input v-for="(digit, index) in spouseEmailOtp" :key="`spouse-email-${index}`"
                      v-model="spouseEmailOtp[index]" :ref="`spouseEmailInput${index}`" class="otp-input-figma"
                      :class="{ 'otp-input-disabled': spouseEmailVerified || !spousePhoneVerified }" :disabled="spouseEmailVerified || !spousePhoneVerified" type="text"
                      maxlength="1" @input="handleOtpInput('spouseEmail', index, $event)"
                      @keydown="handleKeyDown('spouseEmail', index, $event)" />
                  </div>
                  <div class="timer-resend-row" v-if="!spouseEmailVerified">
                    <span class="timer-text">
                      <span :class="{
                        'timer-empty': !formatTime(spouseEmailTimer),
                      }">
                        {{ formatTime(spouseEmailTimer) || "0:00" }}
                        <span class="timer-unit">s</span>
                      </span>
                    </span>
                    <button class="resend-text" :disabled="spouseEmailTimer > 0 || spouseEmailVerified || !spousePhoneVerified"
                      @click="resendOtp('spouseEmail')">
                      {{ spouseEmailVerified ? "Verified" : "Resend" }}
                    </button>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Spouse Phone OTP Block -->
              <v-card v-else-if="blockType === 'spousePhone'" class="verification-card" height="220"
                :width="row.widths[blockIndex] === 'full' ? '540' : null" outlined>
                <v-card-text class="card-content">
                  <div class="card-header">
                    <h3 class="verification-title">Verify Spouse Phone</h3>
                    <div class="verification-subtitle">
                      <p class="mb-0">
                        A one-time password has been sent to your phone
                      </p>
                      <p>{{ spousePhone }}</p>
                    </div>
                  </div>
                  <div class="otp-input-row">
                    <input v-for="(digit, index) in spousePhoneOtp" :key="`spouse-phone-${index}`"
                      v-model="spousePhoneOtp[index]" :ref="`spousePhoneInput${index}`" class="otp-input-figma" :class="{
                        'otp-input-disabled': spousePhoneVerified,
                      }" :disabled="spousePhoneVerified" type="text" maxlength="1"
                      @input="handleOtpInput('spousePhone', index, $event)"
                      @keydown="handleKeyDown('spousePhone', index, $event)" />
                  </div>
                  <div class="timer-resend-row" v-if="!spousePhoneVerified">
                    <span class="timer-text">
                      <span :class="{
                        'timer-empty': !formatTime(spousePhoneTimer),
                      }">
                        {{ formatTime(spousePhoneTimer) || "0:00" }}
                        <span class="timer-unit">s</span>
                      </span>
                    </span>
                    <button class="resend-text" :disabled="spousePhoneTimer > 0 ||
                      spousePhoneVerified
                      " @click="resendOtp('spousePhone')">
                      {{ spousePhoneVerified ? "Verified" : "Resend" }}
                    </button>
                  </div>
                </v-card-text>
              </v-card>
            </v-flex>
          </v-layout>
        </div>
      </v-layout>

      <!-- Verification Complete Message -->
      <!-- <div v-if="canProceed" class="verification-complete-message">
        <v-icon color="#4CAF50" large>mdi-check-circle</v-icon>
        <span class="complete-text">Verification Complete!.</span>
      </div> -->

      <!-- Next Button -->
      <!-- <div class="next-button-container">
        <v-btn class="next-btn" color="#1A73E9" :disabled="!canProceed" @click="proceedNext">
          Next
        </v-btn>
      </div> -->
    </v-card>

    <!-- Zoho signature consent popup (persistent) -->
    <ZohoSignPopup v-model="showZohoPopup" @login="onZohoLogin" />
  </div>
</template>

<script>
import { ApiMigrationMixin } from "@/utils/apiMigration";
import ZohoSignPopup from "@/components/Common/ZohoSignPopup.vue";

export default {
  mixins: [ApiMigrationMixin],
  components: {
    ZohoSignPopup,
  },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      // Local snackbar removed; use global this.$snackbar

      // User data from route/registration (initialized in mounted)
      userEmail: "",
      userPhone: "",
      spouseEmail: "",
      spousePhone: "",
      spouseExists: false,

      // URL parameter flags for conditional display
      showUserOtp: false,
      spouseOtpVerification: false,
      profileEdit: false,
      normalLogin: false,  // Flag for normal login (both email/phone verified)

      // Current verification step
      currentStep: "userPhone", // userPhone -> userEmail -> spousePhone -> spouseEmail

      // OTP arrays for each verification type (6 digits)
      userEmailOtp: ["", "", "", "", "", ""],
      userPhoneOtp: ["", "", "", "", "", ""],
      spouseEmailOtp: ["", "", "", "", "", ""],
      spousePhoneOtp: ["", "", "", "", "", ""],

      // Verification status
      userEmailVerified: false,
      userPhoneVerified: false,
      spouseEmailVerified: false,
      spousePhoneVerified: false,

      // Timers (in seconds, 10 minutes = 600 seconds)
      userEmailTimer: 0,
      userPhoneTimer: 0,
      spouseEmailTimer: 0,
      spousePhoneTimer: 0,

      // Timer intervals
      timerIntervals: {},

      // Zoho signature consent
      showZohoPopup: false,
      signatureConsentData: null,
    };
  },

  computed: {
    canProceed() {
      // If only spouse verification is needed (skip user verification)
      if (this.spouseOtpVerification && !this.showUserOtp) {
        return this.spousePhoneVerified;
      }

      // Check if user OTP sections are required and verified
      const userOtpComplete = this.showUserOtp
        ? this.userEmailVerified && this.userPhoneVerified
        : this.userEmailVerified && this.userPhoneVerified;

      // Check if spouse OTP sections are required and verified (only phone now)
      if (this.spouseOtpVerification && this.showUserOtp) {
        return (
          userOtpComplete &&
          this.spousePhoneVerified
        );
      } else if (this.spouseExists) {
        // Original spouse flow (backward compatibility)
        return (
          userOtpComplete &&
          this.spousePhoneVerified
        );
      } else {
        // No spouse, user can proceed after email and phone verification
        return userOtpComplete;
      }
    },

    // Dynamic OTP blocks array based on verification state
    activeOtpBlocks() {
      // Check URL parameters for conditional display
      const blocks = [];

      // If only spouse verification is needed (spouseOtpVerification=true and showUserOtp=false)
      if (this.spouseOtpVerification && !this.showUserOtp) {
        // Skip user verification, go directly to spouse verification (phone first)
        if (!this.spousePhoneVerified) {
          blocks.push("spousePhone");
        }
      }
      // If showUserOtp=true, display both user phone and user email (phone first)
      else if (this.showUserOtp) {
        // Show user phone if not verified yet or if email is not verified
        if (!this.userPhoneVerified || !this.userEmailVerified) {
          blocks.push("userPhone");
        }
        // Show user email after phone is verified or alongside phone
        if (this.userPhoneVerified || !this.userEmailVerified) {
          blocks.push("userEmail");
        }

        // If spouseOtpVerification=true, show spouse OTP sections after user verification (phone first)
        if (this.spouseOtpVerification && this.userEmailVerified && this.userPhoneVerified) {
          if (!this.spousePhoneVerified) {
            blocks.push("spousePhone");
          }
        }
      } else {
        // Default flow (registration/signup): show user phone first, then email after phone verified
        if (!this.userPhoneVerified) {
          blocks.push("userPhone");
        } else if (!this.userEmailVerified) {
          blocks.push("userPhone", "userEmail");
        }

        // Spouse flow: show spouse phone first
        if (this.spouseExists && this.userEmailVerified && this.userPhoneVerified) {
          if (!this.spousePhoneVerified) {
            blocks.push("spousePhone");
          }
        }
      }

      // If Zoho popup is shown, keep the last verified cards visible
      if (this.showZohoPopup) {
        if (this.spousePhoneVerified || (this.spouseOtpVerification && this.spousePhoneVerified)) {
          return ["spousePhone"];
        } else if (this.userEmailVerified) {
          return ["userPhone", "userEmail"];
        }
      }

      return blocks;
    },

    // Grid layout configuration based on active blocks count
    gridConfig() {
      // Render each active block as a stacked full-width row to match the requested layout
      const blocks = this.activeOtpBlocks || [];
      if (!blocks.length) {
        return { template: "empty", rows: [] };
      }
      return {
        template: "stacked",
        rows: blocks.map((b) => ({ blocks: [b], widths: ["full"] })),
      };
    },

    // Legacy computed properties for backward compatibility
    showUserEmail() {
      return this.activeOtpBlocks.includes("userEmail");
    },

    showUserPhone() {
      return this.activeOtpBlocks.includes("userPhone");
    },

    showSpouseEmail() {
      return this.activeOtpBlocks.includes("spouseEmail");
    },

    showSpousePhone() {
      return this.activeOtpBlocks.includes("spousePhone");
    },
  },

  mounted() {
    // Initialize data from route query parameters
    this.userEmail = this.$route.query.email || "";
    this.userPhone = this.$route.query.phone || "";
    this.spouseEmail = this.$route.query.spouseEmail || "";
    this.spousePhone = this.$route.query.spousePhone || "";
    this.spouseExists = this.$route.query.spouseExists === "true" || false;

    // Initialize URL parameter flags for conditional display
    this.showUserOtp = this.$route.query.showUserOtp === "true" || false;
    this.spouseOtpVerification = this.$route.query.spouseOtpVerification === "true" || false;
    this.profileEdit = this.$route.query.profileEdit === "true" || false;
    this.normalLogin = this.$route.query.normalLogin === "true" || false;

    // Start with appropriate verification based on URL parameters
    if (this.spouseOtpVerification && !this.showUserOtp) {
      // Skip user verification, start directly with spouse phone verification
      this.initializeSpousePhoneVerification();
    } else if (this.normalLogin) {
      // Normal login flow: phone is already verified, only need email OTP
      this.userPhoneVerified = true;
      this.initializeUserEmailVerification();
    } else {
      // Default flow (registration/signup): start with user phone verification
      this.initializeUserPhoneVerification();
    }
  },

  beforeDestroy() {
    // Clear all timers when component is destroyed
    Object.values(this.timerIntervals).forEach((interval) => {
      if (interval) clearInterval(interval);
    });
  },

  methods: {
    async initializeUserPhoneVerification() {
      // Send initial OTP to user phone
      await this.sendOtp("userPhone");
    },

    async initializeUserEmailVerification() {
      // Send initial OTP to user email (for normal login flow)
      this.currentStep = "userEmail";
      await this.sendOtp("userEmail");
    },

    async initializeSpousePhoneVerification() {
      // Send initial OTP to spouse phone (for direct spouse verification)
      this.currentStep = "spousePhone";
      await this.sendOtp("spousePhone");
    },

    handleOtpInput(type, index, event) {
      // Prevent input if already verified
      if (this[`${type}Verified`]) {
        return;
      }

      const value = event.target.value;

      // Only allow single digits
      if (value.length > 1) {
        event.target.value = value.slice(-1);
        this[`${type}Otp`][index] = event.target.value;
      }

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = this.$refs[`${type}Input${index + 1}`];
        if (nextInput && nextInput[0]) {
          nextInput[0].focus();
        }
      }

      // Auto-verify when all 6 digits are entered
      if (this.isOtpComplete(type)) {
        setTimeout(() => {
          this.verifyOtp(type);
        }, 100);
      }
    },

    handleKeyDown(type, index, event) {
      // Handle backspace to move to previous input
      if (
        event.key === "Backspace" &&
        !this[`${type}Otp`][index] &&
        index > 0
      ) {
        const prevInput = this.$refs[`${type}Input${index - 1}`];
        if (prevInput && prevInput[0]) {
          prevInput[0].focus();
        }
      }
    },

    isOtpComplete(type) {
      return this[`${type}Otp`].every((digit) => digit !== "");
    },

    getOtpString(type) {
      return this[`${type}Otp`].join("");
    },

    clearOtp(type) {
      this[`${type}Otp`] = ["", "", "", "", "", ""];
    },

    focusFirstInput(type) {
      setTimeout(() => {
        const firstInput = this.$refs[`${type}Input0`];
        if (firstInput && firstInput[0]) {
          firstInput[0].focus();
        }
      }, 100);
    },

    startTimer(type) {
      // Clear existing timer if any
      if (this.timerIntervals[type]) {
        clearInterval(this.timerIntervals[type]);
      }

      // Set timer to 1 minute (60 seconds)
      this[`${type}Timer`] = 60;

      // Start countdown
      this.timerIntervals[type] = setInterval(() => {
        if (this[`${type}Timer`] > 0) {
          this[`${type}Timer`]--;
        } else {
          clearInterval(this.timerIntervals[type]);
          this.timerIntervals[type] = null;
        }
      }, 1000);
    },

    formatTime(seconds) {
      if (!seconds || seconds <= 0) return "";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },

    async sendOtp(type) {
      try {
        let endpoint = "";
        let payload = {};

        switch (type) {
          case "userEmail":
            endpoint = "/users/auth/email/verify";
            payload = { email: this.userEmail };
            break;
          case "userPhone":
            endpoint = "/users/auth/phone/verify";
            payload = { phone: this.userPhone };
            break;
          case "spouseEmail":
            endpoint = "/users/auth/email/verify";
            payload = { email: this.spouseEmail };
            break;
          case "spousePhone":
            endpoint = "/users/auth/phone/verify";
            payload = { phone: this.spousePhone };
            break;
        }

        await this.submitData(endpoint, payload);

        // Start timer regardless of response (as per requirements)
        this.startTimer(type);

        // Focus on first input
        this.focusFirstInput(type);
      } catch (error) {
        console.error(`Send OTP failed for ${type}:`, error);
        // Start timer even on error
        this.startTimer(type);
      }
    },

    async resendOtp(type) {
      // Clear current OTP
      this.clearOtp(type);

      // Send new OTP (this will reset the timer)
      await this.sendOtp(type);
    },

    async verifyOtp(type) {
      try {
        let endpoint = "";
        let payload = {};

        switch (type) {
          case "userEmail":
            endpoint = "/users/auth/email/verify/confirm";
            payload = {
              email: this.userEmail,
              otp: this.getOtpString(type),
            };
            break;
          case "userPhone":
            endpoint = "/users/auth/phone/verify/confirm";
            payload = {
              phone: this.userPhone,
              otp: this.getOtpString(type),
            };
            break;
          case "spouseEmail":
            endpoint = "/users/auth/email/verify/confirm";
            payload = {
              email: this.spouseEmail,
              otp: this.getOtpString(type),
            };
            break;
          case "spousePhone":
            endpoint = "/users/auth/phone/verify/confirm";
            payload = {
              phone: this.spousePhone,
              otp: this.getOtpString(type),
            };
            break;
        }

        const response = await this.submitData(endpoint, payload);

        if (
          response.success ||
          response.status === 200 ||
          response.status === true
        ) {
          // Show success snackbar with backend-provided message when possible
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiSuccess === "function"
            ) {
              this.$snackbar.showApiSuccess(
                response || `${type} verified successfully`
              );
            } else {
              this.$snackbar.showSuccess(
                response.message || `${type} verified successfully`
              );
            }
          } catch (e) {
            this.$snackbar.showSuccess(
              response.message || `${type} verified successfully`
            );
          }

          // Handle authentication tokens for user verification (both phone and email return tokens)
          if (
            (type === "userPhone" || type === "userEmail" || type === "spousePhone") &&
            response.data
          ) {
            // Store signature consent data from user email verification for later use
            if (
              type === "userEmail" &&
              Object.prototype.hasOwnProperty.call(
                response.data,
                "isSignatureConsentCompleted"
              )
            ) {
              this.signatureConsentData = {
                isSignatureConsentCompleted:
                  response.data.isSignatureConsentCompleted,
                tokens: {
                  accessToken:
                    response.data.accessToken ||
                    response.data.accesstoken ||
                    response.data.token,
                  refreshToken:
                    response.data.refreshToken ||
                    response.data.refreshtoken ||
                    response.data.refresh,
                  userId:
                    response.data.id ||
                    response.data.userId ||
                    response.data.user?.id,
                  userName:
                    response.data.name ||
                    response.data.userName ||
                    response.data.user?.name,
                  userRole:
                    response.data.role ||
                    response.data.userRole ||
                    response.data.user?.role ||
                    "user",
                },
              };
            }

            // Normalize token and user fields (API may return camelCase or lowercase keys)
            const token =
              response.data.accessToken ||
              response.data.accesstoken ||
              response.data.token;
            const refreshToken =
              response.data.refreshToken ||
              response.data.refreshtoken ||
              response.data.refresh;
            const userId =
              response.data.id ||
              response.data.userId ||
              response.data.user?.id;
            const userName =
              response.data.name ||
              response.data.userName ||
              response.data.user?.name;
            const userRole =
              response.data.role ||
              response.data.userRole ||
              response.data.user?.role ||
              "user";
            if (this.profileEdit) {
              this.$snackbar.showSuccess("Successfully verified Spouse Details");
              this.$router.push({ path: "/profile" });

              return;
            }
            // Store normalized values in localStorage
            if (token) {
              localStorage.setItem("accesstoken", token);
            }
            if (refreshToken) {
              localStorage.setItem("refreshtoken", refreshToken);
            }
            if (userId) {
              localStorage.setItem("userId", userId);
            }
            if (userRole) {
              localStorage.setItem("userRole", userRole);
            }
            if (userName) {
              localStorage.setItem("userName", userName);
            }

            // Immediately set axios Authorization header so subsequent API calls use the token
            try {
              // Prefer the app's configured axios instance
              // eslint-disable-next-line global-require
              const apiClient = require("@/plugins/axios").default;
              if (apiClient && apiClient.client && token) {
                apiClient.client.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${token}`;
              }
            } catch (e) {
              // Fallback to window.axios or default axios
              try {
                if (window && window.axios && token) {
                  window.axios.defaults.headers.common[
                    "Authorization"
                  ] = `Bearer ${token}`;
                } else {
                  // eslint-disable-next-line global-require
                  const axios = require("axios");
                  if (axios && token) {
                    axios.defaults.headers.common[
                      "Authorization"
                    ] = `Bearer ${token}`;
                  }
                }
              } catch (err) {
                console.warn("Unable to set axios Authorization header:", err);
              }
            }

            // Update Vuex store with user data using the loginUser action
            // Also ensure tokens are stored and Vuex is updated consistently
            this.$store.dispatch("loginUser", {
              token: token,
              refreshToken: refreshToken,
              userId: userId,
              userRole: userRole,
              userName: userName,
              skipNavigation: true, // Prevent automatic navigation from loginUser action
            });
          }

          // Mark as verified based on API response structure
          let isVerified = false;

          if (response.data) {
            if (type === "userEmail") {
              if (response.data.isEmailVerified === true) {
                this.userEmailVerified = true;
                isVerified = true;
                // Update spouse verification status from user email response if spouse exists
                if (response.data.spouse) {
                  if (response.data.spouse.isEmailVerified === true) {
                    this.spouseEmailVerified = true;
                  }
                  if (response.data.spouse.isPhoneVerified === true) {
                    this.spousePhoneVerified = true;
                  }
                }
              }
            } else if (type === "userPhone") {
              if (response.data.isPhoneVerified === true) {
                this.userPhoneVerified = true;
                isVerified = true;
              }
            } else if (type === "spouseEmail") {
              if (
                response.data.spouse &&
                response.data.spouse.isEmailVerified === true
              ) {
                this.spouseEmailVerified = true;
                isVerified = true;
              }
            } else if (type === "spousePhone") {
              if (
                response.data.spouse &&
                response.data.spouse.isPhoneVerified === true
              ) {
                this.spousePhoneVerified = true;
                isVerified = true;
              }
            }
          }

          // If API response doesn't match expected structure, use fallback
          if (!isVerified) {
            this[`${type}Verified`] = true;
            isVerified = true;
          }

          // Clear the timer
          if (this.timerIntervals[type]) {
            clearInterval(this.timerIntervals[type]);
            this.timerIntervals[type] = null;
          }
          this[`${type}Timer`] = 0;

          // Wait for Vue reactivity to update computed properties
          await this.$nextTick();

          // Move to next step
          await this.moveToNextStep(type);
        } else {
          // Show failure snackbar using backend-provided message when available
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              this.$snackbar.showApiError(
                response || { error: `${type} verification failed` }
              );
            } else {
              // Fallback to previous behavior
              let apiMsg = `${type} verification failed`;
              try {
                if (response && response.data) {
                  apiMsg =
                    response.data.message || response.data.error || apiMsg;
                } else if (response && response.message) {
                  apiMsg = response.message;
                }
              } catch (e) {
                console.warn("Failed to extract API message", e);
              }
              this.$snackbar.showError(apiMsg);
            }
          } catch (e) {
            // no-op
          }

          // Clear OTP on failure
          this.clearOtp(type);
          this.focusFirstInput(type);
        }
      } catch (error) {
        console.error(`OTP verification failed for ${type}:`, error);

        // Prefer backend error message when present — use showApiError
        try {
          if (
            this.$snackbar &&
            typeof this.$snackbar.showApiError === "function"
          ) {
            this.$snackbar.showApiError(
              error || { error: `${type} verification failed` }
            );
          } else {
            // Fallback to previous behavior
            let errMsg = `${type} verification failed`;
            try {
              if (error && error.response && error.response.data) {
                errMsg =
                  error.response.data.message ||
                  error.response.data.error ||
                  errMsg;
              } else if (error && error.message) {
                errMsg = error.message;
              }
            } catch (e) {
              console.warn("Failed to extract error message", e);
            }
            this.$snackbar.showError(errMsg);
          }
        } catch (e) {
          // no-op
        }

        // Clear OTP on error
        this.clearOtp(type);
        this.focusFirstInput(type);
      }
    },

    async moveToNextStep(completedType) {
      switch (completedType) {
        case "userPhone": {
          // After phone verification, move to email verification for registration/signup
          // Dispatch loginUser action after phone verification to authenticate user
          const accessToken = localStorage.getItem("accesstoken");
          const refreshToken = localStorage.getItem("refreshtoken");

          if (accessToken) {
            this.$store.dispatch("loginUser", {
              token: accessToken,
              refreshToken: refreshToken,
              userRole: localStorage.getItem("userRole") || "user",
              userName: localStorage.getItem("userName"),
              userId: localStorage.getItem("userId"),
              skipNavigation: true, // Prevent automatic navigation from loginUser action
            });
          }

          // Move to user email verification after phone
          this.currentStep = "userEmail";
          await this.sendOtp("userEmail");
          break;
        }

        case "userEmail": {
          // After email verification, check if spouse exists
          if (this.spouseExists) {
            // Move to spouse phone verification
            this.currentStep = "spousePhone";

            // Force reactivity update
            await this.$nextTick();

            await this.sendOtp("spousePhone");
          } else {
            // No spouse, check signature consent after user email verification
            this.checkSignatureConsent();

            // Automatically proceed to next page after verification is complete

          }
          break;
        }

        case "spousePhone":
          // Spouse email verification removed as per requirement
          // All verifications complete, check signature consent
          this.checkSignatureConsent();
          break;

        case "spouseEmail":
          // All verifications complete, check signature consent
          this.checkSignatureConsent();

          // Automatically proceed to next page after all verifications are complete

          break;
      }
    },

    proceedNext() {
      if (this.canProceed) {
        // Ensure user is authenticated before navigation
        const accessToken = localStorage.getItem("accesstoken");
        if (!accessToken) {
          console.warn("No access token found in localStorage during proceedNext");
          // If we are in profileEdit mode, we likely already have a token or don't need a new one
          if (!this.profileEdit) {
            this.$snackbar.showError(
              "Authentication required. Please verify your identity."
            );
            return;
          }
        }

        // If profileEdit is true, navigate back to /profile
        if (this.profileEdit) {
          this.$router.push({ path: "/profile" }).catch(err => {
            console.error("Navigation to /profile failed:", err);
          });
          return;
        }

        // For signup, normalLogin, and all other flows → redirect to /application
        this.waitForAxiosAuth(2000)
          .then(() => {
            this.$router.push({ path: "/application" }).catch(err => {
              console.error("Navigation to /application failed:", err);
            });
          })
          .catch(() => {
            // Fallback: navigate anyway but show warning
            console.warn("Axios auth header not ready, navigating anyway");
            this.$router.push({ path: "/application" }).catch(err => {
              console.error("Fallback navigation failed:", err);
            });
          });
      }
    },

    // Wait until axios.defaults.headers.common.Authorization is set or timeout
    waitForAxiosAuth(timeout = 2000) {
      return new Promise((resolve, reject) => {
        // Check configured axios instance first
        try {
          // eslint-disable-next-line global-require
          const apiClient = require("@/plugins/axios").default;
          if (
            apiClient &&
            apiClient.client &&
            apiClient.client.defaults.headers.common["Authorization"]
          ) {
            return resolve();
          }
        } catch (e) {
          // ignore
        }

        const interval = 100;
        let waited = 0;
        const timer = setInterval(() => {
          waited += interval;
          try {
            // Check configured axios instance
            // eslint-disable-next-line global-require
            const apiClient = require("@/plugins/axios").default;
            if (
              apiClient &&
              apiClient.client &&
              apiClient.client.defaults.headers.common["Authorization"]
            ) {
              clearInterval(timer);
              return resolve();
            }

            // Fallback: window.axios
            if (
              window &&
              window.axios &&
              window.axios.defaults &&
              window.axios.defaults.headers &&
              window.axios.defaults.headers.common &&
              window.axios.defaults.headers.common["Authorization"]
            ) {
              clearInterval(timer);
              return resolve();
            }
          } catch (e) {
            // ignore
          }
          if (waited >= timeout) {
            clearInterval(timer);
            return reject();
          }
        }, interval);
      });
    },

    // Check signature consent after final phone verification
    async checkSignatureConsent() {
      if (
        this.signatureConsentData &&
        this.signatureConsentData.isSignatureConsentCompleted === false
      ) {
        // Show Zoho popup if signature consent is incomplete
        this.showZohoPopup = true;
      } else {
        await this.$nextTick();
        if (this.canProceed) {
          this.proceedNext();
        }
      }
      // If consent is completed or no data, continue normal flow (user can click Next)
    },

    // Handler for ZohoSignPopup login click
    onZohoLogin() {
      // Clear user session completely
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshtoken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");

      // Close the popup and redirect to login
      this.showZohoPopup = false;
      this.$router.push({ name: "login" });
    },

    async initializeFCMAfterLogin() {
      try {
        console.log("Initializing FCM after login...");
        // Dynamically import FCM service
        const FCMService = (await import("@/services/fcm")).default;
        const fcmToken = await FCMService.initialize();
        if (fcmToken) {
          console.log("FCM token generated and sent to server after login");
        }
      } catch (error) {
        console.error("Error initializing FCM after login:", error);
      }
    },
  },
};
</script>

<style scoped>
/* Figma-based Layout Styles with v-layout/v-flex */

/* Layout Container for Both Grid and Single Layouts */
.verification-layout-container {
  /* //padding: 40px 40px; */
  /* margin-top: 27px; */
  width: 100%;
  max-width: 1136px;
  /* margin-left: auto;
  margin-right: auto; */
}

.verification-row {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.verification-flex {
  width: 100%;
  transition: all 0.3s ease;
}

/* Dynamic Grid Layout Styles */
.verification-row {
  transition: all 0.3s ease;
  width: 100%;
}

.row-layout {
  justify-content: center;
  align-items: stretch;
}

.single-row {
  justify-content: center;
}

.single-row .verification-flex {
  display: flex;
  justify-content: center;
}

.dual-row {
  justify-content: space-between;
}

/* Card animations */
.verification-card {
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.single-card {
  width: 540px;
}

/* Verification Card Styles - Exact Figma Match */
.verification-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 220px;
  /* increase default min-height */
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  /* extra bottom padding to create gap between timer row and card border */
  padding: 23px 2px 36px !important;
  width: 536px;
  margin: 0 auto;
  height: 210px;
  /* increased height to match taller card */
  justify-content: space-between;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* Typography - DM Sans Font Family */
.verification-title {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: black;
  text-align: center;
  margin: 0;
  width: 100%;
}

.verification-subtitle {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #5f5f5f;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.verification-subtitle p {
  margin: 0;
}

.verification-subtitle .mb-0 {
  margin-bottom: 0;
}

/* OTP Input Row - 4 inputs with 36px gap */
.otp-input-row {
  display: flex;
  gap: 30px;
  align-items: center;
  justify-content: center;
}

/* OTP Input Figma Styles - Exact 46x46px */
.otp-input-figma {
  width: 46px;
  height: 46px;
  background: white;
  border: 1.095px solid rgba(0, 0, 0, 0.1);
  border-radius: 0;
  text-align: center;
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: black;
  outline: none;
  transition: border-color 0.2s ease;
}

.otp-input-figma:focus {
  border-color: #1a73e9;
  box-shadow: 0 0 0 1px #1a73e9;
}

.otp-input-figma.otp-input-disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: rgba(0, 0, 0, 0.05);
}

/* Timer and Resend Row */
.timer-resend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 292px;
  max-width: 100%;
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  white-space: pre;
  margin: 0 auto;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* Move timer row slightly upwards from the card bottom border */
.timer-resend-row {
  margin-bottom: 12px;
  /* pulls the row up inside the card */
}

.timer-text {
  color: #1a73e9;
  flex-shrink: 0;
}

.timer-text {
  min-width: 56px;
  /* reserve space to avoid shifting */
  display: inline-block;
}

.timer-empty {
  visibility: hidden;
}

.timer-unit {
  font-size: 14px;
  margin-left: 4px;
  color: #1a73e9;
}

.resend-text {
  color: #1a73e9;
  background: none;
  border: none;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  text-align: right;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.resend-text:hover:not(:disabled) {
  opacity: 0.8;
}

.resend-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design for Mobile */
@media (max-width: 1200px) {
  /* .verification-layout-container {
    height: auto;
    min-height: 220px; /* slightly taller on mobile */

  .verification-row {
    flex-direction: column;
  }

  .verification-flex {
    width: 100%;
    max-width: 540px;
    margin: 0 auto 20px auto;
    padding: 0;
  }

  .verification-card {
    width: 100%;
    max-width: 540px;
  }
}

@media (max-width: 600px) {
  .verification-card {
    height: auto;
    min-height: 250px;
    padding: 15px 10px;
  }

  .card-content {
    gap: 18px;
    padding: 20px 10px 30px;
    width: 100%;
  }

  .otp-input-row {
    gap: 8px;
  }

  .otp-input-figma {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .timer-resend-row {
    width: 100%;
    max-width: 280px;
    padding: 0 10px;
  }

  .verification-title {
    font-size: 16px;
  }

  .verification-subtitle {
    font-size: 14px;
  }
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
  /* gap: 27px; */
  align-items: center;
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.verification-complete-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 1100px;
  margin: 20px auto;
  padding: 16px 24px;
  background-color: #E8F5E9;
  border-radius: 8px;
  border: 1px solid #4CAF50;
  animation: fadeInScale 0.5s ease;
}

.complete-text {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #2E7D32;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.next-button-container {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  max-width: 1100px;
  margin-bottom: 20px;
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

/* Base Responsive Design */
@media (max-width: 1200px) {
  .otp-verification-container {
    padding: 20px;
  }

  .next-button-container {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .otp-verification-container {
    padding: 30px 15px;
  }
}
</style>

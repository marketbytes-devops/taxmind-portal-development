<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="error white--text">
        <v-icon left color="white">mdi-alert-circle</v-icon>
        <span style="font-family: DMSans; font-weight: 600">Delete Account</span>
        <v-spacer></v-spacer>
        <v-btn icon color="white" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="pt-5">
        <v-layout wrap justify-center>
          <v-flex xs12 text-center pb-3>
            <v-icon size="80" color="error">mdi-account-remove-outline</v-icon>
          </v-flex>
          <v-flex xs12 text-center pb-4>
            <span style="font-family: DMSans; font-size: 18px; font-weight: 600; color: #d32f2f">
              Warning: This action cannot be undone!
            </span>
          </v-flex>
          <v-flex xs12 pb-3>
            <span style="font-family: DMSans; font-size: 16px; color: #424242">
              To confirm account deletion, please enter your email address:
            </span>
          </v-flex>
          <v-flex xs12>
            <v-text-field v-model="emailVerification" label="Enter your email to confirm" outlined dense
              :error-messages="emailError" @input="validateEmail" style="font-family: DMSans"
              prepend-inner-icon="mdi-email"></v-text-field>
          </v-flex>
          <v-flex xs12 pb-2>
            <v-alert text dense border="left" style="text-align: left;margin-bottom: 0px;" colored-border
              elevation="1">
              <span style="font-family: DMSans; font-size: 14px; text-align: left;">
                <strong>Deleting your account will:</strong>
                <ul style="margin-top: 8px; text-align: left;">
                  <li>Permanently remove all your personal data</li>
                  <li>Delete all your applications and documents</li>
                  <li>Remove access to all services</li>
                  <li>This action is irreversible</li>
                </ul>
              </span>
            </v-alert>
          </v-flex>
        </v-layout>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="closeDialog" style="font-family: DMSans; font-weight: 500">
          Cancel
        </v-btn>
        <v-btn color="error" :disabled="!isEmailValid" @click="confirmDelete"
          style="font-family: DMSans; font-weight: 600" :loading="deleting">
          <v-icon left>mdi-delete-forever</v-icon>
          Delete My Account
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from "axios";

export default {
  name: "DeleteAccountDialog",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    userEmail: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      emailVerification: "",
      emailError: "",
      isEmailValid: false,
      deleting: false,
    };
  },
  computed: {
    dialog: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  watch: {
    dialog(newVal) {
      if (newVal) {
        this.resetForm();
      }
    },
  },
  methods: {
    resetForm() {
      this.emailVerification = "";
      this.emailError = "";
      this.isEmailValid = false;
    },
    closeDialog() {
      this.dialog = false;
      this.resetForm();
    },
    validateEmail() {
      const userEmail = this.userEmail?.toLowerCase().trim();
      const enteredEmail = this.emailVerification?.toLowerCase().trim();

      if (!enteredEmail) {
        this.emailError = "";
        this.isEmailValid = false;
        return;
      }

      if (enteredEmail === userEmail) {
        this.emailError = "";
        this.isEmailValid = true;
      } else {
        this.emailError = "Email does not match your account email";
        this.isEmailValid = false;
      }
    },
    async confirmDelete() {
      if (!this.isEmailValid) {
        this.$snackbar.showError("Please verify your email address");
        return;
      }

      this.deleting = true;

      try {
        const response = await axios({
          url: "/users/auth/delete-account",
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
          },
        });

        this.deleting = false;

        if (response.data.status) {
          this.$snackbar.showSuccess(
            "Your account has been successfully deleted. You will be redirected to the login page."
          );

          // Clear all local storage
          localStorage.clear();

          // Redirect to login page after 2 seconds
          setTimeout(() => {
            this.$router.push({ path: "/login" });
          }, 2000);
        } else {
          this.$snackbar.showError(
            response.data.message || "Failed to delete account. Please try again."
          );
        }
      } catch (err) {
        this.deleting = false;

        let errorMessage = "An unexpected error occurred. Please try again.";

        if (err.response) {
          if (err.response.status === 500) {
            errorMessage = "A server error occurred. Please try again later.";
          } else {
            errorMessage =
              err.response?.data?.message ||
              "Failed to delete account. Please try again.";
          }
        }

        this.$snackbar.showError(errorMessage);
        this.closeDialog();
      }
    },
  },
};
</script>

<style scoped>
/* Add any component-specific styles here if needed */
</style>

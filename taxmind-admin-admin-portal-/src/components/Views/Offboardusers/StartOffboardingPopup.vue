<template>
  <v-dialog v-model="value" max-width="640" persistent>
    <div class="start-offboarding-popup">
      <!-- Header -->
      <div class="popup-header">
        <span class="popup-title">Start off boarding</span>
        <v-btn icon small @click="closePopup" class="close-btn">
          <v-icon color="white" size="20">mdi-close</v-icon>
        </v-btn>
      </div>
      <!-- Content -->
      <div class="popup-content">
        <!-- PPS Number Input Section -->
        <div class="input-section">
          <div class="input-label">PPS Number</div>
          <div class="input-row">
            <v-text-field
              v-model="localPpsNumber"
              outlined
              dense
              :error-messages="error"
              :error="!!error"
              placeholder="Enter PPS Number"
              class="pps-input"
              background-color="white"
              @keyup.enter="searchUser"
            />
            <v-btn
              outlined
              color="primary"
              class="search-btn"
              @click="searchUser"
              :loading="loading"
              :disabled="loading || !localPpsNumber.trim()"
            >
              <v-icon left size="16" v-if="!loading">mdi-magnify</v-icon>
              Search
            </v-btn>
          </div>
        </div>
        <v-divider v-if="userFound" class="mb-7"></v-divider>
        <!-- User Details Section -->
        <div class="user-details" v-if="userFound">
          <v-layout wrap>
            <v-flex xs5 pa-6 class="details-labels">
              <div class="detail-label">Name</div>
              <div class="detail-label">Email</div>
              <div class="detail-label">PPS Number</div>
              <div class="detail-label">Created date</div>
            </v-flex>
            <v-flex shrink class="d-flex justify-center">
              <v-divider
                vertical
                class="mx-4"
                style="height: 100%; background-color: #e0e0e0"
              ></v-divider>
            </v-flex>
            <v-flex xs7 pa-6 class="details-values">
              <div class="detail-value">{{ userData.name }}</div>
              <div class="detail-value">{{ userData.email }}</div>
              <div class="detail-value">{{ userData.ppsNumber }}</div>
              <div class="detail-value">{{ userData.createdDate }}</div>
            </v-flex>
          </v-layout>
        </div>

        <!-- Action Button -->
        <div class="popup-actions" v-if="userFound">
          <v-btn
            color="error"
            depressed
            :ripple="false"
            class="add-offboard-btn"
            @click="addToOffboard"
          >
            Add to off board
          </v-btn>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script>
import { removeOffboardUser } from "@/api/modules/offboarduser";
import http from "@/api/http";

export default {
  name: "StartOffboardingPopup",
  props: {
    value: { type: Boolean, required: true },
  },
  data() {
    return {
      localPpsNumber: "",
      userFound: false,
      userData: {
        name: "",
        email: "",
        ppsNumber: "",
        createdDate: "",
      },
      loading: false,
      error: null,
    };
  },
  watch: {
    value(val) {
      if (!val) {
        this.localPpsNumber = "";
        this.userFound = false;
      }
    },
  },
  methods: {
    closePopup() {
      this.$emit("input", false);
    },
    searchUser() {
      if (this.localPpsNumber.trim()) {
        this.loading = true;
        this.error = null;
        this.userFound = false;

        // Call the API with keyword parameter - using /users endpoint
        const apiParams = {
          keyword: this.localPpsNumber.trim(),
        };

        http
          .get("users", {
            params: apiParams,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          })
          .then((response) => {
            this.loading = false;

            if (
              response.data &&
              response.data.success &&
              response.data.data &&
              response.data.data.length > 0
            ) {
              // Get the first matching user
              const user = response.data.data[0];

              // Update user data
              this.userData = {
                id: user.id || user._id,
                name:
                  user.name ||
                  `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                email: user.email || "-",
                ppsNumber: user.ppsNumber || user.pps || this.localPpsNumber,
                createdDate: this.formatDate(user.createdAt || user.date),
              };

              this.userFound = true;
            } else {
              this.error = "No user found with this PPS number";
            }
          })
          .catch((err) => {
            this.loading = false;
            this.error =
              err.response?.data?.message || "Error searching for user";
            console.error("Search user error:", err);
          });
      }
    },
    addToOffboard() {
      if (!this.userFound || !this.userData) return;

      this.loading = true;
      this.error = null;

      // Get the user ID from the userData object
      const userId = this.userData.id;

      if (!userId) {
        this.error = "User ID not found";
        this.loading = false;
        return;
      }

      // Use the addOffboardUser function to offboard the user
      removeOffboardUser({ userId: userId })
        .then((response) => {
          this.loading = false;
          if (response.data && response.data.success) {
            // Close the popup and refresh the list
            this.$emit("input", false);
            this.$emit("refresh");
            this.userFound = false;
            this.localPpsNumber = "";
          } else {
            this.error = response.data?.message || "Failed to offboard user";
          }
        })
        .catch((err) => {
          this.loading = false;
          this.error = err.response?.data?.message || "Error offboarding user";
          console.error("Offboard user error:", err);
        });
    },

    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
  },
};
</script>

<style scoped>
.start-offboarding-popup {
  width: 640px;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  font-family: "DM Sans", sans-serif;
}

.popup-header {
  background: #1a73e9;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.popup-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
}

.close-btn {
  background: none !important;
  box-shadow: none !important;
}

.popup-content {
  padding: 24px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 8px;
  font-family: "DM Sans", sans-serif;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.pps-input {
  flex: 1;
  font-family: "DM Sans", sans-serif;
}

.pps-input >>> .v-input__control {
  min-height: 40px !important;
}

.pps-input >>> .v-input__slot {
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  background: #ffffff !important;
  min-height: 40px !important;
  padding: 0 12px !important;
}

.pps-input >>> .v-text-field__slot input {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  color: #000000 !important;
}

.pps-input >>> .v-text-field__slot input::placeholder {
  color: rgba(95, 95, 95, 0.5) !important;
  font-family: "DM Sans", sans-serif !important;
}

.search-btn {
  min-width: 110px !important;
  height: 40px !important;
  border: 1px solid #1a73e9 !important;
  border-radius: 4px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #1a73e9 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
  background: #ffffff !important;
}

.search-btn:hover {
  background: #f1f7ff !important;
}

.user-details {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 24px;
  background: #ffffff;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 16px;
  font-weight: 400;
  color: #5f5f5f;
  font-family: "DM Sans", sans-serif;
}

.detail-value {
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  font-family: "DM Sans", sans-serif;
}

.popup-actions {
  display: flex;
  justify-content: center;
}

.add-offboard-btn {
  min-width: 150px !important;
  height: 40px !important;
  background: #dc3545 !important;
  border-radius: 4px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #ffffff !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
}

.add-offboard-btn:hover {
  background: #c82333 !important;
}

.details-two-column {
  display: flex;
  align-items: stretch;
  min-height: 120px;
  /* Ensure minimum height for the divider */
}

.details-labels,
.details-values {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  justify-content: space-between;
}

.vertical-divider {
  width: 1px;
  background-color: #e0e0e0;
  margin: 0 24px;
  align-self: stretch;
}

.detail-label {
  font-size: 16px;
  font-weight: 400;
  color: #5f5f5f;
  font-family: "DM Sans", sans-serif;
}

.detail-value {
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  font-family: "DM Sans", sans-serif;
}
</style>
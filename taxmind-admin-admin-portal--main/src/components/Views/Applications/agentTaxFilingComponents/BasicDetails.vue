<template>
  <v-card elevation="0" flat class="px-4">
    <!-- Custom Application Numbers Section -->
    <!-- <v-layout wrap class="application-numbers-section" v-if="!useDetailsComponent">
      <v-flex xs12>
        <span class="Head3">
          Application Number : TXM00127
          <v-btn v-if="showCopyButtons" icon small class="copy-btn"
            @click="copyToClipboard(getFieldValue('applicationNumber'))">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" contain alt="Copy" />
          </v-btn>
        </span>
      </v-flex>
      <v-flex xs12>
        <span class="Head3">
          Agent activation Number : AGN-8734-XY92
          <v-btn v-if="showCopyButtons" icon small class="copy-btn"
            @click="copyToClipboard(getFieldValue('agentActivationNumber'))">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" contain alt="Copy" />
          </v-btn>
        </span>
      </v-flex>
    </v-layout>

    <v-layout wrap class="user-info-section pa-0" v-if="!useDetailsComponent">
      <v-flex v-for="(row, rowIndex) in userInfoRows" :key="rowIndex" xs12>
        <v-layout wrap>
          <v-flex v-for="field in row" :key="field.key" :xs12="field.fullWidth" :sm6="!field.fullWidth"
            :md3="!field.fullWidth" class="info-field">
            <div class="field-label">{{ field.label }}</div>
            <div class="field-value-container">
              <span class="field-value">{{ getFieldValue(field.key) }}
                <v-btn v-if="showCopyButtons" icon x-small class="copy-btn-field"
                  @click="copyToClipboard(getFieldValue(field.key))">
                  <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" alt="Copy" />
                </v-btn>
              </span>
            </div>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout> -->

    <!-- Using Details component when useDetailsComponent is true -->
    <Details :applicantdata="applicantdata" :userData="userData" :spouseData="spouseData" :showCopyButtons="true"
      :showViewButton="showViewButton" :showDownloadButton="true" @show-message="handleShowMessage" />
  </v-card>
</template>

<script>
import Details from '../../Applications/Details.vue';

export default {
  name: "BasicDetails",
  components: {
    Details
  },
  props: {
    applicantdata: {
      type: Object,
      default: () => ({}),
    },
    userData: {
      type: Object,
      default: () => ({}),
    },
    spouseData: {
      type: Object,
      default: () => ({})
    },
    useDetailsComponent: {
      type: Boolean,
      default: false
    },
    showCopyButtons: {
      type: Boolean,
      default: true
    },
    showViewButton: {
      type: Boolean,
      default: false
    },
  },

  data() {
    return {
      // Application Numbers Configuration
      applicationNumbers: [
        {
          key: "applicationNumber",
          label: "Application Number",
          fallback: "TXM00127",
        },
        {
          key: "agentActivationNumber",
          label: "Agent activation Number",
          fallback: "AGN-8734-XY92",
        },
      ],
      appNumber: {
        key: "applicationNumber",
      },

      // User Info Fields Configuration
      userInfoRows: [
        // Row 1
        [
          { key: "name", label: "Name", fallback: "Manu Sunny" },
          {
            key: "email",
            label: "Email",
            fallback: "manusunny123@yopmail.com",
          },
          { key: "phone", label: "Phone Number", fallback: "9876543210" },
          {
            key: "dateOfBirth",
            label: "Date of Birth",
            fallback: "10-06-2025",
          },
        ],
        // Row 2
        [
          {
            key: "profession",
            label: "Profession",
            fallback: "Quality analyst",
          },
          { key: "ppsNumber", label: "PPS Number", fallback: "8765432A" },
          { key: "eircode", label: "Eircode", fallback: "A65F4E2" },
          {
            key: "maritalStatus",
            label: "Marital Status",
            fallback: "Married",
          },
        ],
        // Row 3 - Address (Full Width)
        [
          {
            key: "address",
            label: "Address",
            fallback:
              "12 Main Street, Rathmines,\nDublin 6, D06 X5F3,\nIreland",
            fullWidth: true,
          },
        ],
      ],
    };
  },

  methods: {
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.$emit("show-message", "Copied to clipboard");
      } catch (error) {
        this.$emit("show-message", "Error copying to clipboard");
      }
    },

    handleShowMessage(message) {
      this.$emit("show-message", message);
    },

    getFieldValue(fieldKey) {
      const value = this.applicationData[fieldKey];

      // Handle null, undefined, empty string, or empty array
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return "-";
      }

      // Handle special formatting for address
      if (fieldKey === "address") {
        return this.formatAddress(value);
      }

      return value;
    },

    formatAddress(address) {
      if (!address || address === "") {
        return "12 Main Street, Rathmines,\nDublin 6, D06 X5F3,\nIreland";
      }
      return address;
    },
  },
  computed: {
    // Format data for the Details component
    formattedApplicantData() {
      return {
        applicationNo: this.getFieldValue('applicationNumber'),
        status: 'Active', // You can adjust this based on your data structure
        createdAt: new Date(), // You can adjust this based on your data structure
      };
    },
    formattedUserData() {
      // Map the application data to the format expected by Details component
      return {
        name: this.getFieldValue('name'),
        email: this.getFieldValue('email'),
        phone: this.getFieldValue('phone'),
        dob: this.getFieldValue('dateOfBirth'),
        profession: this.getFieldValue('profession'),
        ppsNumber: this.getFieldValue('ppsNumber'),
        eircode: this.getFieldValue('eircode'),
        address: this.getFieldValue('address'),
        maritalStatus: this.getFieldValue('maritalStatus'),
      };
    }
  },
};
</script>

<style scoped>
/* Pixel Perfect Design Matching Figma */
.basic-details-container {
  font-family: "DM Sans", sans-serif;
  background-color: #ffffff !important;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
}

/* Application Numbers Section */
.application-numbers-section {
  /* margin-bottom: 32px; */
  padding: 24px 0;
  /* border-bottom: 1px solid #f1f5f9; */
}

.app-number-row {
  margin-bottom: 16px;
}

.app-number-row:last-child {
  margin-bottom: 0;
}

.app-number-text {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: #000000;
  font-variation-settings: "opsz" 14;
}

.copy-btn {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 4px !important;
  min-width: auto !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 6px !important;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background-color: #f8fafc !important;
}

.copy-btn .v-btn__content {
  width: 12px;
  height: 12px;
}

/* User Information Section */
.user-info-section {
  margin-bottom: 0;
}

.info-row-flex {
  margin-bottom: 24px;
}

.info-row-flex:last-child {
  margin-bottom: 0;
}

.info-field {
  padding: 0 12px 12px 0;
}

.info-field:last-child {
  padding-right: 0;
}

.field-label {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #64748b;
  margin-bottom: 8px;
  font-variation-settings: "opsz" 14;
}

.field-value-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 24px;
}

.field-value {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #1e293b;
  flex: 1;
  white-space: pre-line;
  font-variation-settings: "opsz" 14;
  word-break: break-word;
}

.copy-btn-field {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 2px !important;
  min-width: auto !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 4px !important;
  transition: background-color 0.2s;
  flex-shrink: 0;
  margin-top: 0;
}

.copy-btn-field:hover {
  background-color: #f1f5f9 !important;
}

.copy-btn-field .v-btn__content {
  width: 12px;
  height: 12px;
}

/* Responsive Design using Vuetify breakpoints */
@media (max-width: 1200px) {
  .info-field {
    padding: 0 8px 12px 0;
  }
}

@media (max-width: 960px) {
  .basic-details-container {
    padding: 20px;
    margin-bottom: 20px;
  }

  .application-numbers-section {
    margin-bottom: 24px;
    padding-bottom: 20px;
  }

  .info-row-flex {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .basic-details-container {
    padding: 16px;
    margin-bottom: 16px;
  }

  .app-number-text {
    font-size: 16px;
  }

  .field-label,
  .field-value {
    font-size: 13px;
  }

  .application-numbers-section {
    /* margin-bottom: 20px; */
    padding-bottom: 16px;
  }
}

@media (max-width: 600px) {
  .app-number-row .v-col {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 8px;
  }

  .copy-btn {
    margin-left: 0 !important;
  }
}

@media (max-width: 480px) {
  .basic-details-container {
    padding: 12px;
    margin-bottom: 12px;
  }

  .field-label,
  .field-value {
    font-size: 12px;
  }

  .app-number-text {
    font-size: 14px;
  }
}
</style>
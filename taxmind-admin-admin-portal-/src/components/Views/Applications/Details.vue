<template>
  <div>
    <v-layout wrap pa-4 justify-space-between class="white">
      <v-flex xs4 class="d-flex flex-column">
        <span class="text3 text-no-wrap">
          APPLICATION NO: {{ applicantdata.applicationNo }}
          <v-btn v-if="showCopyButtons" icon small class="copy-btn"
            @click="copyToClipboard(applicantdata.applicationNo)">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" contain alt="Copy" />
          </v-btn>
          <v-btn v-if="showDownloadButton" small color="primary" class="ml-2" @click="downloadApplicationDocument" title="Download Application Document">
            <v-icon left small>mdi-download</v-icon>
            Download
          </v-btn>
        </span>
        <span v-if="!showCopyButtons" class="text3" style="color: #f19d20">
          STATUS: {{ applicantdata.status }}
          <v-btn v-if="showCopyButtons" icon small class="copy-btn" @click="copyToClipboard(applicantdata.status)">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" contain alt="Copy" />
          </v-btn>
        </span>
        <!-- <span v-if="showCopyButtons" class="text3">
          Agent Activation Number: {{ applicantdata.agentActivationNumber }}
          <v-btn v-if="showCopyButtons" icon small class="copy-btn"
            @click="copyToClipboard(applicantdata.agentActivationNumber)">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" contain alt="Copy" />
          </v-btn>
        </span> -->
      </v-flex>
      <v-flex shrink text-right>
        <base-button v-if="showViewButton" label="View Application" @click="goNext" />
      </v-flex>
    </v-layout>
    <v-divider></v-divider>
    <v-layout wrap pa-4 pb-0>
      <v-flex v-for="(field, index) in fields" :key="index" xs12 sm6 md3 pa-2 class="d-flex flex-column">
        <span class="text4">{{ field.label }}</span>
        <span v-if="field.label === 'PDF'" class="text5">
          <a target="_blank" :href="ipURL +
            '/v1/admin/user/download-pdf?id=' +
            userData._id +
            '&type=Spouse'
            " class="downlink">
            <v-icon color="red">mdi-file-pdf-box</v-icon>
            Download
          </a>
        </span>
        <span v-else-if="field.key === 'dob'" class="text5">
          {{ userData.dob }}
          <v-btn v-if="showCopyButtons" icon x-small class="copy-btn-field"
            @click="copyToClipboard(formatDate(userData.dob, false))">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" alt="Copy" />
          </v-btn>
        </span>
        <span v-else-if="field.key === 'create_date'" class="text5">
          {{ formatDate(applicantdata.createdAt) }}
          <v-btn v-if="showCopyButtons" icon x-small class="copy-btn-field"
            @click="copyToClipboard(formatDate(applicantdata.createdAt))">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" alt="Copy" />
          </v-btn>
        </span>

        <!-- Format martial status -->

        <span v-else-if="field.key === 'maritalStatus'" class="text5">
          {{ formatMaritalStatus(userData[field.key]) }}
          <v-btn v-if="showCopyButtons" icon x-small class="copy-btn-field"
            @click="copyToClipboard(formatMaritalStatus(userData[field.key]))">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" alt="Copy" />
          </v-btn>
        </span>




        <!--  -->
        <span v-else class="text5">
          {{ userData[field.key] }}
          <v-btn v-if="showCopyButtons" icon x-small class="copy-btn-field"
            @click="copyToClipboard(userData[field.key])">
            <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" alt="Copy" />
          </v-btn>
        </span>
      </v-flex>
    </v-layout>

    <!-- Spouse Details Section -->
    <v-layout wrap pb-4 justify-start v-if="hasSpouse">
      <v-flex xs12>
        <v-layout wrap justify-start px-4 pt-4>
          <v-flex xs12 sm12 md12 lg12 xl12 text-left>
            <span style="color: black; font-family: opensansbold; font-size: 25px;">Spouse Details</span>
          </v-flex>
        </v-layout>
        <v-layout wrap justify-start px-4 pt-4>
          <v-flex v-for="(field, index) in spouseFields" :key="index" xs12 sm6 md3 pa-2 class="d-flex flex-column">
            <span class="text4">{{ field.label }}</span>
            <span v-if="field.key === 'dob'" class="text5">

              {{ formattedSpouseDateOfBirth }}
              <v-btn v-if="showCopyButtons && spouseData.dob" icon x-small class="copy-btn-field"
                @click="copyToClipboard(formattedSpouseDateOfBirth)">
                <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" alt="Copy" />
              </v-btn>
            </span>
            <span v-else class="text5">

              {{ spouseData[field.key] || "_____________" }}
              <v-btn v-if="showCopyButtons && spouseData[field.key]" icon x-small class="copy-btn-field"
                @click="copyToClipboard(spouseData[field.key])">
                <v-img :src="require('@/assets/iconsets/coppy.svg')" width="12" height="12" alt="Copy" />
              </v-btn>
            </span>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
import { downloadApplication } from "@/api/modules/applications";

export default {
  name: "Details",
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    spouseData: {
      type: Object,
      default: () => ({})
    },
    showCopyButtons: {
      type: Boolean,
      default: false
    },
    showViewButton: {
      type: Boolean,
      default: true
    },
    showDownloadButton: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      fields: [
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone Number", key: "phone" },
        { label: "Date Of Birth", key: "dob" },
        { label: "Profession", key: "profession" },
        { label: "PPS Number", key: "ppsNumber" },
        { label: "Eircode", key: "eircode" },
        { label: "Address", key: "address" },
        { label: "Marital Status", key: "maritalStatus" },
        // { label: "PDF", key: "" },
        { label: "Submitted On", key: "create_date" },
      ],
      spouseFields: [
        { label: "Full Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone Number", key: "phone" },
        { label: "Date Of Birth", key: "dob" },
        { label: "Profession", key: "profession" },
        { label: "PPS Number", key: "ppsNumber" },
        { label: "Eircode", key: "eircode" },
        { label: "Address", key: "address" },
      ],
    };
  },
  computed: {
    formattedDateOfBirth() {
      if (!this.userData.dob) return "_____________";
      const date = new Date(this.userData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    formattedSpouseDateOfBirth() {
      if (!this.spouseData.dob) return "_____________";
      const date = new Date(this.spouseData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    hasSpouse() {
      return this.userData.spouse || (this.spouseData && Object.keys(this.spouseData).length > 0);
    },
  },
  methods: {
    goNext() {
      console.log("Go Next clicked", this.applicantdata);
    },
    async downloadApplicationDocument() {
      try {
        const applicationId = this.applicantdata.id || this.applicantdata._id;
        
        if (!applicationId) {
          this.$emit("show-message", "Application ID not found");
          return;
        }

        this.$emit("show-message", "Downloading application document...");
        
        // Call the API using the applications module
        const response = await downloadApplication(applicationId);
        
        // Create a blob from the response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Application_${this.applicantdata.applicationNo || applicationId}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.$emit("show-message", "Application document downloaded successfully");
      } catch (error) {
        console.error('Download error:', error);
        this.$emit("show-message", error.response?.data?.message || "Error downloading document");
      }
    },
    formatDate(item, showTime = true) {
      const dt = new Date(item);
      let day = dt.getDate();
      const year = dt.getFullYear();
      let hours = dt.getHours();
      let minutes = dt.getMinutes();

      const month = dt.toLocaleString("en-US", { month: "short" }); // e.g., "Oct"

      // format day
      day = day < 10 ? "0" + day : day;

      let strTime = `${day} ${month} ${year}`;

      if (showTime) {
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 → 12
        minutes = minutes < 10 ? "0" + minutes : minutes;

        strTime += ` ${hours}:${minutes} ${ampm}`;
      }

      return strTime;
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.$emit("show-message", "Copied to clipboard");
      } catch (error) {
        this.$emit("show-message", "Error copying to clipboard");
      }
    },

    formatMaritalStatus(status) {
      if (!status) return "_____________";
      const statusMap = {
        single: "Single",
        married: "Married",
        divorced: "Divorced",
        widowed: "Widowed",
        separated: "Separated",
        civil_partnership: "Civil Partnership",
        married_spouse_abroad: "Married spouse abroad",
      };
      return statusMap[status.toLowerCase()] || status;
    },
  },
};
</script>

<style scoped>
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
</style>

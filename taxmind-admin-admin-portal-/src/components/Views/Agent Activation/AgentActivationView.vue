<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: #ffffff">
            {{ msg }}
          </span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon style="color: #ffffff">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <v-layout wrap justify-center pb-16>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">
          <v-flex xs12 sm6 text-start align-self-center pt-2 class="carousalhead">Agent Activation
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex shrink align-self-center>
            <PermissionButton module-name="agent_activation" permission="edit" class="csv-btn" outlined
              @click="$router.push('/upload-csv')">
              <v-icon left>mdi-download</v-icon>
              Import CSV
            </PermissionButton>
          </v-flex>
        </v-layout>

        <!-- Agent Activation Table inside white background layout -->
        <v-layout column>
          <v-flex class="white" mb-2>
            <v-data-table :headers="headers" :items="agentActivationData" :items-per-page="itemsPerPage"
              :hide-default-footer="true" class="agent-activation-table" :mobile-breakpoint="0">
              <!-- Item Template -->
              <template v-slot:item="{ item }">
                <tr :class="{'pending-row': !item.isActivated}">
                  <td>
                    <span class="cell-text">{{ item.noticeNo }}</span>
                  </td>
                  <td>
                    <span class="cell-text">{{ item.customerName }}</span>
                  </td>
                  <td>
                    <span class="cell-text">{{ item.regnTraderNo }}</span>
                  </td>
                  <td>
                    <span class="cell-text">{{ item.mandatoryEFiler }}</span>
                  </td>
                  <td>
                    <v-chip dark :color="item.isActivated ? 'success' : 'warning'" x-small class="mr-1">
                      {{ item.isActivated ? 'Active' : 'Pending' }}
                    </v-chip>
                    <span class="cell-text">{{ item.documentType }}</span>
                  </td>
                  <td>
                    <span class="cell-text">{{ item.periodBegin }}</span>
                  </td>
                  <td>
                    <span class="cell-text">{{ item.issuedDate }}</span>
                  </td>
                </tr>
              </template>
            </v-data-table>

            <!-- Pagination Controls -->
            <div class="text-center py-3" v-if="totalItems > itemsPerPage">
              <v-pagination v-model="currentPage" :length="Math.ceil(totalItems / itemsPerPage)"
                @input="handlePageChange" color="#1A73E9" circle></v-pagination>
            </div>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import http from "@/api/http";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';

export default {
  name: "AgentActivationView",
  components: {
    PermissionButton,
  },
  mixins: [permissionMixin],
  data() {
    return {
      // Loading states
      appLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      ServerError: false,

      // Table headers matching API response
      headers: [
        {
          text: "Notice No",
          value: "noticeNo",
          sortable: false,
          align: "left",
          width: "140px",
        },
        {
          text: "Customer Name",
          value: "customerName",
          sortable: false,
          align: "left",
          width: "180px",
        },
        {
          text: "Regn./Trader No./Doc ID",
          value: "regnTraderNo",
          sortable: false,
          align: "left",
          width: "140px",
        },
        {
          text: "Mandatory EFiler",
          value: "mandatoryEFiler",
          sortable: false,
          align: "left",
          width: "120px",
        },
        {
          text: "Document Type",
          value: "documentType",
          sortable: false,
          align: "left",
          width: "140px",
        },
        {
          text: "Period Begin",
          value: "periodBegin",
          sortable: false,
          align: "left",
          width: "120px",
        },
        {
          text: "Issued Date",
          value: "issuedDate",
          sortable: false,
          align: "left",
          width: "120px",
        },
      ],

      // Initialize with empty array, will be populated from API
      agentActivationData: [],
      // Pagination
      totalItems: 0,
      currentPage: 1,
      itemsPerPage: 10,
      //   mandatoryEFiler: "NO",
      //   documentType: "Tax Registration",
      //   periodBegin: "N/A",
      //   issuedDate: "25/07/2025",
      // },
      // {
      //   noticeNo: "7265060303O",
      //   customerName: "CHIRAYATH, JERNET",
      //   regnNo: "9907400KA",
      //   mandatoryEFiler: "NO",
      //   documentType: "Approved Agent",
      //   periodBegin: "24/07/2025",
      //   issuedDate: "25/07/2025",
      // },
      // {
      //   noticeNo: "6571726130O",
      //   customerName: "PERUMTHOTTATHIL..",
      //   regnNo: "9907400KA",
      //   mandatoryEFiler: "NO",
      //   documentType: "Tax Registration",
      //   periodBegin: "24/07/2025",
      //   issuedDate: "25/07/2025",
      // },
      // {
      //   noticeNo: "6657422484C",
      //   customerName: "ENTSIWAH, WILLIAM",
      //   regnNo: "9907400KA",
      //   mandatoryEFiler: "NO",
      //   documentType: "Tax Registration",
      //   periodBegin: "24/07/2025",
      //   issuedDate: "25/07/2025",
      // },
      // {
      //   noticeNo: "6231233698E",
      //   customerName: "PERUMTHOTTATHIL..",
      //   regnNo: "9907400KA",
      //   mandatoryEFiler: "NO",
      //   documentType: "Approved Agent",
      //   periodBegin: "N/A",
      //   issuedDate: "25/07/2025",
      // },
      // {
      //   noticeNo: "7027432754E",
      //   customerName: "MARTIN, ANJANA",
      //   regnNo: "9907400KA",
      //   mandatoryEFiler: "NO",
      //   documentType: "Approved Agent",
      //   periodBegin: "N/A",
      //   issuedDate: "25/07/2025",
      // },
      // {
      //   noticeNo: "5241460847K",
      //   customerName: "52414MARTIN,..",
      //   regnNo: "9907400KA",
      //   mandatoryEFiler: "NO",
      //   documentType: "Approved Agent",
      //   periodBegin: "N/A",
      //   issuedDate: "25/07/2025",
      // },
      // {
      //   noticeNo: "7173437129G",
      //   customerName: "KARUKAYIL...",
      //   regnNo: "9907400KA",
      //   mandatoryEFiler: "NO",
      //   documentType: "Approved Agent",
      //   periodBegin: "24/07/2025",
      //   issuedDate: "25/07/2025",
      // },
      // ],
    };
  },
  mounted() {
    this.fetchAgentActivationData();
  },
  methods: {
    // Import CSV functionality
    importCSV() {
      console.log("Import CSV clicked");
      // Add your CSV import logic here
      this.msg = "CSV import functionality will be implemented";
      this.showSnackBar = true;
    },

    // Fetch agent activation data from API
    async fetchAgentActivationData() {
      try {
        this.appLoading = true;

        // Add pagination parameters
        const params = {
          page: this.currentPage,
          size: this.itemsPerPage
        };

        const response = await http.get("users/agent-activations", { params });

        this.appLoading = false;

        if (response.data.success) {
          // Extract data from the API response
          this.agentActivationData = response.data.data.records || [];

          // Update pagination data
          if (response.data.data.pagination) {
            this.totalItems = response.data.data.pagination.total || 0;
          }
        } else {
          this.msg = response.data.message || "Failed to fetch data";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        this.handleApiError(err);
      }
    },

    // Handle page change event
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchAgentActivationData();
    },

    handleApiError(err) {
      if (err.response) {
        if (err.response.status === 500) {
          this.ServerError = true;
          this.msg = "A server error occurred. Please try again later.";
        } else {
          this.ServerError = false;
          this.msg = err.response.data.message || "An error occurred.";
        }
      } else {
        this.ServerError = true;
        this.msg = "An unexpected error occurred. Please try again.";
      }
      this.showSnackBar = true;
    },
  },
};
</script>

<style scoped>
/* === Agent Activation Table Styles === */
.agent-activation-table {
  background: #ffffff;
}

.agent-activation-table .v-data-table__wrapper {
  overflow-x: auto;
}

/* ----- Headers ----- */
::v-deep(.agent-activation-table .v-data-table-header th),
::v-deep(.agent-activation-table .v-data-table-header th .v-data-table-header__content) {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 12px;
  min-height: 60px;
  /* Taller headers for 2-line text */
  vertical-align: top;
  font-family: "DM Sans", sans-serif;
  font-weight: 800;
  /* ExtraBold */
  font-size: 14px;
  line-height: 16px;
  color: #000000;
  text-transform: none;
  /* keep camel/mixed case */
  white-space: pre-line;
  /* respect \n */
  cursor: default;
  /* disable pointer on hover */
}

::v-deep(.agent-activation-table .v-data-table-header th .v-data-table-header__icon) {
  display: none;
  /* hide sort icons */
}

/* ----- Rows ----- */
.agent-activation-table tbody tr {
  background: #ffffff;
  transition: background-color 0.2s ease;
}

.agent-activation-table tbody tr.pending-row {
  background: #fffbef; /* Light yellow for pending/inactive */
}

.agent-activation-table tbody tr:hover {
  background: #f8f9fa;
}

.agent-activation-table tbody tr.pending-row:hover {
  background: #fff3cd;
}

/* ----- Cells ----- */
.agent-activation-table tbody td {
  padding: 16px 12px;
  border-bottom: 1px solid #e0e0e0;
  /* ✅ border on each row */
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-activation-table tbody tr:last-child td {
  border-bottom: none;
  /* remove last row divider */
}

.agent-activation-table th:nth-child(1),
.agent-activation-table td:nth-child(1) {
  width: 140px;
}

.agent-activation-table th:nth-child(2),
.agent-activation-table td:nth-child(2) {
  width: 180px;
}

.agent-activation-table th:nth-child(3),
.agent-activation-table td:nth-child(3) {
  width: 140px;
}

.agent-activation-table th:nth-child(4),
.agent-activation-table td:nth-child(4) {
  width: 120px;
}

.agent-activation-table th:nth-child(5),
.agent-activation-table td:nth-child(5) {
  width: 150px;
}

.agent-activation-table th:nth-child(6),
.agent-activation-table td:nth-child(6) {
  width: 120px;
}

.agent-activation-table th:nth-child(7),
.agent-activation-table td:nth-child(7) {
  width: 120px;
}

/* ----- Hide Footer ----- */
.agent-activation-table .v-data-footer {
  display: none;
}

/* ----- Typography for header title ----- */
.carousalhead {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 31px;
  color: #000000;
}

.cell-text {
  white-space: nowrap !important;
}

.csv-btn {
  border: 1px solid #5f5f5f80;
  /* your custom border */
  color: #000000;
  /* text + icon color */
}

/* ----- Responsive ----- */
@media (max-width: 1024px) {
  .v-flex.pt-5 {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .agent-activation-table {
    min-width: 800px;
  }
}
</style>
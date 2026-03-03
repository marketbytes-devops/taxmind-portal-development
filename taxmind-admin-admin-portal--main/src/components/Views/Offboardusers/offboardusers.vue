<template>
  <div class="ma-4">
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="#1A73E9" right :timeout="timeout">
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

    <v-layout wrap class="roleHeader Head1 pa-3 d-flex justify-space-between align-center">
      <v-flex xs2>
        <span>Off board users</span>
      </v-flex>
      <v-flex shrink class="d-flex align-center" style="gap: 16px">
        <v-text-field v-model="keyword" placeholder="Search user" prepend-inner-icon="mdi-magnify" outlined dense
          hide-details class="search-input" />
        <!-- <v-select :hide-details="true" v-model="sortBy" :items="sortOptions" item-text="text" item-value="value"
          label="Sort By" style="font-family: opensansregular; min-width: 150px;" solo dense flat outlined></v-select> -->
        <FilledButton v-if="canCreate('offboard_users')" color="#1A73E9" text="Start off boarding"
          :onClick="openStartOffboarding" />
      </v-flex>
    </v-layout>

    <v-layout wrap justify-center>
      <v-flex xs12>
        <v-card elevation="0" class="white pa-0">
          <v-data-table :headers="headers" :items="offboardUsers" class="offboard-table" hide-default-footer
            :items-per-page="limit" :disable-pagination="true" disable-sort>
            <template v-slot:item="{ item, index }">
              <tr class="table-row">
                <td class="data-cell sl-no-cell">
                  <span class="cell-text">
                    <span v-if="currentPage > 1">
                      {{ (currentPage - 1) * limit + index + 1 }}
                    </span>
                    <span v-else>{{ index + 1 }}</span>
                  </span>
                </td>
                <td class="data-cell name-cell">
                  <span class="cell-text">{{ item.name || item.firstName + ' ' + item.lastName || '-' }}</span>
                </td>
                <td class="data-cell email-cell">
                  <span class="cell-text">{{ item.email || '-' }}</span>
                </td>
                <td class="data-cell pps-cell">
                  <span class="cell-text">{{ item.ppsNumber || item.pps || '-' }}</span>
                </td>
                <td class="data-cell date-cell">
                  <span class="cell-text">{{ formatDate(item.date || item.createdAt) }}</span>
                </td>
              </tr>
            </template>
          </v-data-table>

          <!-- Pagination -->

        </v-card>
        <v-layout wrap justify-center pt-2 v-if="pages > 1">
          <v-flex xs12>
            <div class="text-center pb-5">
              <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
            </div>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>

    <StartOffboardingPopup v-model="showStartOffboarding" @refresh="getData" />
  </div>
</template>

<script>
import FilledButton from "@/components/utilities/FilledButton.vue";
import StartOffboardingPopup from "./StartOffboardingPopup.vue";
import { listOffboardUsers } from "@/api/modules/offboarduser";
import debounce from "lodash/debounce";
import permissionMixin from '@/mixins/permissionMixin';
// import PermissionButton from '@/components/Common/PermissionButton.vue';

export default {
  name: "OffboardUsers",
  components: {
    FilledButton,
    StartOffboardingPopup,
    // PermissionButton,
  },
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      keyword: "",
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      isComponentMounted: false,
      showStartOffboarding: false,
      headers: [
        { text: "SL.NO", value: "slno", class: "sl-no-header", width: "8%" },
        { text: "NAME", value: "name", class: "name-header", width: "20%" },
        { text: "EMAIL", value: "email", class: "email-header", width: "32%" },
        {
          text: "PPS NUMBER",
          value: "ppsNumber",
          class: "pps-header",
          width: "20%",
        },
        { text: "DATE", value: "date", class: "date-header", width: "20%" },
      ],
      sortOptions: [
        { text: "Latest First", value: "updatedAt" },
        // { text: "Name A-Z", value: "name" },
        // { text: "Email A-Z", value: "email" },
        { text: "Date Added", value: "createdAt" },
      ],
      sortBy: "updatedAt",
      orderBy: "desc",
      currentPage: 1,
      pages: 0,
      limit: 10,
      offboardUsers: [],
    };
  },
  created() {
    this.debouncedGetData = debounce(this.getData, 1000);
  },
  watch: {
    currentPage() {
      this.getData();
    },
    sortBy() {
      // Only trigger API call if component is already mounted
      if (this.isComponentMounted) {
        this.getData();
      }
    },
    keyword() {
      this.currentPage = 1;
      this.debouncedGetData();
    },
  },
  mounted() {
    this.getData();
    // Set flag after initial data load to prevent duplicate API calls
    this.$nextTick(() => {
      this.isComponentMounted = true;
    });
  },
  methods: {
    getData() {
      if (this.keyword === "") {
        this.keyword = null;
      }

      this.appLoading = true;

      // Prepare parameters for API
      const params = {
        page: this.currentPage,
        size: this.limit,
        keyword: this.keyword,
        sortBy: this.sortBy,
        orderBy: this.orderBy,
      };

      listOffboardUsers(params)
        .then((response) => {
          this.appLoading = false;

          console.log("Offboard users data=", response.data);
          if (response.data && response.data.success) {
            this.offboardUsers = response.data.data || [];
            const total = response.data.metadata?.total || this.offboardUsers.length;
            this.pages = Math.ceil(total / this.limit);
          } else {
            this.offboardUsers = [];
            this.pages = 0;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.handleApiError(err);
        });
    },
    openStartOffboarding() {
      this.showStartOffboarding = true;
    },
    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    /**
     * Centralized error handling for API calls
     */
    handleApiError(err) {
      if (err.response) {
        if (err.response.status === 500) {
          this.ServerError = true;
          this.msg = "A server error occurred. Please try again later.";
        } else if (err.response.status === 401) {
          this.msg = "Unauthorized. Please login again.";
        } else if (err.response.status === 403) {
          this.msg = "Access denied. Insufficient permissions.";
        } else {
          this.ServerError = false;
          this.msg = err.response.data.message || "An error occurred.";
        }
      } else {
        this.ServerError = true;
        this.msg = err.message || "An unexpected error occurred. Please try again.";
      }
      this.showSnackBar = true;
      console.error("API Error:", err);
    },
  },
};
</script>

<style scoped>
.roleHeader {
  background: #fff;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
  position: relative;
}

.search-input ::v-deep input::placeholder {
  font-weight: 400 !important;
  color: #5f5f5f !important;
}

/* Start Offboarding Popup - Pixel Perfect */
.start-offboarding-popup {
  width: 640px;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  font-family: "DM Saans", sans-serif;
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

.input-section {
  margin-bottom: 24px;
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
  align-items: flex-end;
}

.pps-input {
  flex: 1;
  font-family: "DM Sans", sans-serif;
}

.pps-input>>>.v-input__control {
  min-height: 40px !important;
}

.pps-input>>>.v-input__slot {
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  background: #ffffff !important;
  min-height: 40px !important;
  padding: 0 12px !important;
}

.pps-input>>>.v-text-field__slot input {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  color: #000000 !important;
}

.pps-input>>>.v-text-field__slot input::placeholder {
  color: rgba(95, 95, 95, 0.5) !important;
  font-family: "DM Sans", sans-serif !important;
}

.search-btn {
  min-width: 110px !important;
  height: 40px !important;
  border: 1px solid #1a73e9 !important;
  border-radius: 8px !important;
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
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  background: #ffffff;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;
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
  border-radius: 8px !important;
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

/* FilledButton Styling */
.action-btn.publish-btn {
  min-width: 148px !important;
  height: 40px !important;
}

/* Offboard Users Table - Pixel Perfect */
.offboard-table {
  font-family: "DM Sans", sans-serif !important;
  border-radius: 5px !important;
  overflow: hidden !important;
}

.offboard-table>>>.v-data-table__wrapper {
  border-radius: 5px !important;
  overflow: hidden !important;
}

/* Table Header Styling */
.table-header {
  background: #ffffff !important;
  height: 48px !important;
  border-bottom: 1px solid #e0e0e0 !important;
}

.header-cell {
  padding: 0 16px !important;
  border-right: none !important;
  vertical-align: middle !important;
  height: 48px !important;
  background: #ffffff !important;
}

.header-text {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 800;
  font-size: 14px;
  color: #000;
  letter-spacing: 0.5px !important;
}

/* Table Row Styling */
.table-row {
  height: 48px !important;
  border-bottom: 1px solid #e0e0e0 !important;
  background: #ffffff !important;
}

.table-row:hover {
  background: #f8f9fa !important;
}

.data-cell {
  padding: 0 16px !important;
  height: 48px !important;
  vertical-align: middle !important;
  border-right: none !important;

}

.cell-text {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400;
  font-size: 14px;
  color: #000;
  line-height: 1.2 !important;
}

/* Specific cell styling to match Figma */
.sl-no-cell {
  width: 8% !important;
}

.name-cell {
  width: 20% !important;
}



.email-cell {
  width: 32% !important;
}


.pps-cell {
  width: 20% !important;
}


.date-cell {
  width: 20% !important;
}



/* Remove default Vuetify table styles */
.offboard-table>>>.v-data-table thead th {
  background: #ffffff !important;
  color: #000000 !important;
  font-weight: 900 !important;
  border-bottom: 1px solid #e0e0e0 !important;
}

.offboard-table>>>.v-data-table tbody tr:hover:not(.v-data-table__expanded__content) {
  background: #f8f9fa !important;
}

.offboard-table>>>.v-data-table tbody tr td {
  border-bottom: 1px solid #e0e0e0 !important;
}

/* Table container */
.offboard-table>>>.v-data-table {
  border-radius: 5px !important;
  overflow: hidden !important;
  box-shadow: none !important;
}
</style>
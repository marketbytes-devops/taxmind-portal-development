<template>
  <div>
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

    <v-layout wrap justify-center>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">
          <v-flex xs12 sm4 md6 lg6 text-start align-center pt-2 class="carousalhead">Users List
          </v-flex>
          <v-flex xs12 sm4 md2 lg2 text-end align-center pt-2 class="carousalhead"><v-text-field v-model="keyword"
              ref="searchField" dense placeholder="Search User .." solo flat outlined hide-details="auto"
              append-icon="mdi-magnify" clearable style="border-color: rgba(99, 102, 123, 0.1)">
            </v-text-field>
          </v-flex>
          <v-flex xs12 sm4 md2 lg2 text-end align-center pt-2 pl-lg-2 pl-sm-2 pl-md-2 class="carousalhead">
            <v-select :hide-details="true" v-model="status" :items="statusArray" item-text="text" item-value="value"
              label="Status" style="font-family: opensansregular" solo dense flat outlined></v-select>
          </v-flex>
          <v-flex xs12 sm4 md2 lg2 pl-lg-2 pl-sm-2 pl-md-2 text-end align-center pt-2 class="carousalhead">
            <v-select :hide-details="true" v-model="year" :items="yearArray" label="Year"
              style="font-family: opensansregular" solo dense clearable flat outlined></v-select>
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start class="my-3">
          <v-flex xs12>
            <v-tabs v-model="currentTab" color="#1A73E9" @change="handleTabChange">
              <v-tab v-for="tab in tabItems" :key="tab">
                {{ tab }}
              </v-tab>
            </v-tabs>
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <div class="table-container">
                  <v-simple-table class="elevation-0 custom-table">
                    <template v-slot:default>
                      <thead>
                        <tr>
                          <th v-for="header in computedHeaders" :key="header.value" class="text-left nowrap-cell"
                            :style="header.width ? `width: ${header.width}` : ''">
                            {{ header.text }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, index) in usersList" :key="item.id" :style="'cursor: pointer'"
                          @click="viewUserDetails(item)">
                          <td class="nowrap-cell">
                            <span v-if="currentPage > 1">
                              {{ (currentPage - 1) * limit + index + 1 }}
                            </span>
                            <span v-else>{{ index + 1 }}</span>
                          </td>
                          <td class="nowrap-cell">{{ item.name }}</td>
                          <td class="nowrap-cell">{{ item.ppsNumber }}</td>
                          <td class="nowrap-cell">{{ item.email }}</td>
                          <td class="nowrap-cell">{{ item.phone }}</td>
                          <td class="nowrap-cell">{{ formatDate(item.createdAt) }}</td>
                          <td class="nowrap-cell">
                            <v-chip
                              small
                              :color="getStatusColor(item)"
                              dark
                              depressed
                            >
                              {{ getStatusText(item) }}
                            </v-chip>
                          </td>
                          <td class="nowrap-cell">
                            <v-chip v-if="item.isJointAssessment" :color="item.parentId ? 'info' : 'success'" dark x-small>
                              {{ item.parentId ? 'Spouse' : 'Primary' }}
                            </v-chip>
                            <span v-else>-</span>
                          </td>
                          <td class="nowrap-cell" v-if="currentTab === 3">
                            {{ item.pairedWith ? item.pairedWith.name : '-' }}
                          </td>
                          <td class="nowrap-cell">
                            {{ item.remark || '-' }}
                            <v-btn icon small @click.stop="openEditRemark(item)">
                              <v-icon small>mdi-pencil</v-icon>
                            </v-btn>
                          </td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>
                </div>
              </v-flex>
            </v-layout>

            <!-- Edit Remark Dialog -->
            <v-dialog v-model="editRemarkDialog" max-width="500">
              <v-card class="rounded-lg">
                <v-card-title class="headline">Edit Remark</v-card-title>
                <v-card-text>
                  <v-textarea
                    v-model="editingRemark"
                    label="Remark"
                    outlined
                    rows="3"
                    hide-details
                  ></v-textarea>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn text @click="editRemarkDialog = false">Cancel</v-btn>
                  <v-btn color="#1A73E9" dark @click="saveRemark">Save</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            <!-- pagination -->
            <v-layout wrap justify-center pt-2>
              <v-flex xs12>
                <div class="text-center pb-5" v-if="pages > 1">
                  <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
                </div>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>

    <!-- terminate dialog -->
    <v-dialog v-model="deletedialog" max-width="600">
      <v-card class="dialog-card">
        <v-card-title class="grey lighten-2 d-flex justify-center">
          <v-icon color="red" size="32">mdi-alert</v-icon>
          <span class="ml-2">Confirm Termination</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">
            Are you sure you want to terminate this user?
          </div>
          <v-divider class="my-3"></v-divider>
          <v-row class="pt-2" no-gutters>
            <v-col>
              <v-icon style="color: #1a73e9">mdi-account-box-outline</v-icon>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="d-flex justify-center pa-2">
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#cf3a45"
            @click="deletedialog = false">Cancel</v-btn>
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#1A73E9"
            @click="confirmterminate">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- activate dialog -->
    <v-dialog v-model="activatedialog" max-width="600">
      <v-card class="dialog-card">
        <v-card-title class="grey lighten-2 d-flex justify-center">
          <v-icon color="red" size="32">mdi-alert</v-icon>
          <span class="ml-2">Confirm Activation</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">Are you sure you want to activate this user?</div>
          <v-divider class="my-3"></v-divider>
          <v-row class="pt-2" no-gutters>
            <v-col>
              <v-icon style="color: #1a73e9">mdi-account-box-outline</v-icon>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="d-flex justify-center pa-2">
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#cf3a45"
            @click="activatedialog = false">Cancel</v-btn>
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#1A73E9"
            @click="confirmactivate">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- delete dialog -->
    <v-dialog v-model="Perdeletedialog" max-width="600">
      <v-card class="dialog-card">
        <v-card-title class="grey lighten-2 d-flex justify-center">
          <v-icon color="red" size="32">mdi-alert</v-icon>
          <span class="ml-2">Confirm Permenant Deletion</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">
            Are you sure you want to delete this user permenantly?
          </div>
          <v-divider class="my-3"></v-divider>
          <v-row class="pt-2" no-gutters>
            <v-col>
              <v-icon style="color: #1a73e9">mdi-account-box-outline</v-icon>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="d-flex justify-center pa-2">
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#cf3a45"
            @click="Perdeletedialog = false">Cancel</v-btn>
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#1A73E9"
            @click="confirmPerDelete">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import {
  listUsers,
  terminateOrActivateUser,
  deleteUser,
  requestAgentActivation,
  updateUserRemark,
} from "@/api/modules/users";
// import store from "../../../store";
import debounce from "lodash/debounce";
import permissionMixin from "@/mixins/permissionMixin";

export default {
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      activatedialog: false,
      Perdeletedialog: false,
      keyword: "",
      usersList: [],
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      itemToDelete: null,
      itemToactivate: null,
      itemToPerDelete: null,
      currentTab: 0,
      tabItems: ["Active Users", "Off Board Users", "Return Users", "Joint Assessment"],
      editRemarkDialog: false,
      editingRemark: "",
      selectedUserForRemark: null,
      headers: [
        { text: "Sl.No", value: "slno", align: "start" },
        { text: "Name", value: "name", align: "start" },
        { text: "PPS Number", value: "ppsNumber", align: "start" },
        { text: "Email", value: "email", align: "start" },
        { text: "Phone Number", value: "phone", align: "start" },
        { text: "Created On", value: "createdAt", align: "start" },
        { text: "Status", value: "status", align: "start" },
        { text: "Account Type", value: "accountType", align: "start" },
        { text: "Remark", value: "remark", align: "start" },
      ],
      statusArray: [
        { text: "All", value: "all" },
        { text: "ROS Not Updated", value: "ros_not_updated" },
        { text: "ROS Updated", value: "ros_updated" },
        { text: "Agent Activated", value: "agent_activated" },
      ],
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 10,
      yearArray: [],
    };
  },
  computed: {
    status: {
      get() {
        return this.$store.state.status || "all";
      },
      set(value) {
        // Only commit if value is valid (not empty string, not undefined)
        if (value !== undefined && value !== null && value !== "") {
          this.$store.commit("changeUsersStatus", value);
        }
      }
    },
    year: {
      get() {
        return this.$store.state.year;
      },
      set(value) {
        // Always commit year changes, including clearing (null)
        this.$store.commit("changeUsersYear", value);
      }
    },
    computedHeaders() {
      let displayHeaders = [...this.headers];
      
      // If current tab is Joint Assessment (index 3), add Paired With column
      if (this.currentTab === 3) {
        displayHeaders.splice(8, 0, { text: "Paired With", value: "pairedWith", align: "start" });
      }

      if (this.status === "PENDING") {
        return displayHeaders.filter((header) => header.value !== "id");
      }
      return displayHeaders;
    },
  },
  created() {
    this.debouncedGetData = debounce(this.getData, 1000);
  },
  watch: {
    '$route.query.page': {
      handler(newPage) {
        const pageNum = parseInt(newPage);
        if (pageNum && pageNum > 0 && pageNum !== this.currentPage) {
          this.currentPage = pageNum;
        }
      },
      immediate: false
    },
    currentPage() {
      this.$store.commit("changeUsersCurrentPage", this.currentPage);
      // Update URL with current page
      if (this.$route.query.page !== String(this.currentPage)) {
        this.$router.replace({ 
          query: { 
            ...this.$route.query, 
            page: this.currentPage 
          } 
        });
      }
      this.getData();
    },
    '$store.state.status': {
      handler() {
        this.getData();
      },
      immediate: false
    },
    '$store.state.year': {
      handler() {
        this.getData();
      },
      immediate: false
    },
    keyword() {
      this.currentPage = 1;
      this.debouncedGetData();
    },
  },
  mounted() {
    // Initialize status from query parameter if present
    if (this.$route.query.status) {
      const queryStatus = this.$route.query.status;
      if (queryStatus !== this.status) {
        this.status = queryStatus;
      }
    }

    // Derive page with priority: URL > Store > 1
    const urlPageRaw = this.$route.query.page;
    const urlPage = parseInt(urlPageRaw, 10);
    const storePageRaw = this.$store.state.currentPage;
    const storePage = parseInt(storePageRaw, 10);

    if (!isNaN(urlPage) && urlPage > 0) {
      // Use page from URL; let watcher fetch data
      if (this.currentPage !== urlPage) {
        this.currentPage = urlPage;
      } else {
        // If already matching, fetch once
        this.getData();
      }
    } else if (!isNaN(storePage) && storePage > 0) {
      // Use page from store and sync URL
      this.currentPage = storePage;
      if (this.$route.query.page !== String(this.currentPage)) {
        this.$router.replace({
          query: {
            ...this.$route.query,
            page: this.currentPage,
          },
        });
      }
      // Fetch data (watcher will also run if route changed but guard equality prevents loops)
      this.getData();
    } else {
      // Default to page 1 and sync URL
      this.currentPage = 1;
      if (this.$route.query.page !== '1') {
        this.$router.replace({
          query: {
            ...this.$route.query,
            page: 1,
          },
        });
      }
      this.getData();
    }
  },
  beforeMount() {
    this.generateYears();
  },
  methods: {
    generateYears() {
      const startYear = 2024;
      const currentYear = new Date().getFullYear();
      this.yearArray = [];
      for (let year = startYear; year <= currentYear; year++) {
        this.yearArray.push(year);
      }
    },

    getStatusText(item) {
      if (item.isTaxAgentVerificationCompleted) {
        return "Agent Activated";
      } else if (item.isTaxAgentVerificationRequestSent) {
        return "ROS Updated";
      } else {
        return "ROS Not Updated";
      }
    },

    getStatusColor(item) {
      if (item.isTaxAgentVerificationCompleted) {
        return "#4CAF50"; // Success Green
      } else if (item.isTaxAgentVerificationRequestSent) {
        return "#2196F3"; // Blue
      } else {
        return "#FF9800"; // Warning Orange
      }
    },

    async handleROSCheckboxChange(item) {
      if (item.isTaxAgentVerificationCompleted) {
        this.msg = `Cannot modify ROS status - Agent is already activated`;
        this.showSnackBar = true;
        return;
      }
      const newValue = !item.isTaxAgentVerificationRequestSent;
      item.isTaxAgentVerificationRequestSent = newValue;


      this.appLoading = true;

      try {
        const response = await requestAgentActivation(item.id);

        this.appLoading = false;

        if (response.data && response.data.success !== false) {
          this.msg = `ROS Updated ${newValue ? 'requested' : 'cancelled'} for ${item.name}`;
          this.showSnackBar = true;
        } else {
          throw new Error(response.data.message || "Failed to update ROS status");
        }
      } catch (error) {
        this.appLoading = false;

        item.isTaxAgentVerificationRequestSent = !newValue;

        this.handleApiError(error);
      }
    },

    handleTabChange() {
      this.currentPage = 1;
      this.getData();
    },
    openEditRemark(item) {
      this.selectedUserForRemark = item;
      this.editingRemark = item.remark || "";
      this.editRemarkDialog = true;
    },
    async saveRemark() {
      if (!this.selectedUserForRemark) return;
      this.appLoading = true;
      try {
        await updateUserRemark(this.selectedUserForRemark.id, this.editingRemark);
        this.msg = "Remark updated successfully";
        this.showSnackBar = true;
        this.editRemarkDialog = false;
        this.getData();
      } catch (error) {
        this.handleApiError(error);
      } finally {
        this.appLoading = false;
      }
    },
    getData() {
      // Do not mutate `keyword` here; using a local normalized value prevents
      // triggering the keyword watcher that would reset `currentPage` to 1.
      const keywordParam = this.keyword === "" ? null : this.keyword;

      this.appLoading = true;

      // Prepare parameters for new API
      const params = {
        page: this.currentPage,
        limit: this.limit,
        keyword: keywordParam,
      };

      // include status if provided (route or UI) and not 'all'
      if (this.status && this.status.trim() !== "" && this.status.toLowerCase() !== "all") {
        params.status = this.status.trim();
      } else {
        // Fallback to tab-based status
        const tabMap = ["active", "offboard", "return", "joint_assessment"];
        params.status = tabMap[this.currentTab];
      }

      // Add date filtering if year is selected
      if (this.year) {
        params.startDate = `${this.year}-01-01`;
        params.endDate = `${this.year}-12-31`;
      }

      // Note: Status filtering may need to be handled differently
      // as the new API might not support status filtering directly

      listUsers(params)
        .then((response) => {
          this.appLoading = false;

          // Handle the actual API response structure
          // Handle the actual API response structure
          if (response.data) {
            const rawList = response.data.data || [];
            // const getCreatedTs = (u) => {
            //   const v = u && (u.createdAt || u.created_at);
            //   const t = v ? Date.parse(v) : NaN;
            //   return Number.isNaN(t) ? 0 : t;
            // };
            // Sort by createdAt descending (newest first)
            this.usersList = rawList
            const total =
              response.data.metadata?.total || this.usersList.length;
            this.pages = Math.ceil(total / this.limit);
          } else {
            this.usersList = [];
            this.pages = 0;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.handleApiError(err);
        });
    },
    openterminateDialog(item) {
      this.itemToDelete = item;
      this.deletedialog = true;
    },
    openactivateDialog(item) {
      this.itemToactivate = item;
      this.activatedialog = true;
    },
    opendeleteDialog(item) {
      this.itemToPerDelete = item;
      this.Perdeletedialog = true;
    },
    confirmterminate() {
      if (this.itemToDelete) {
        this.terminateItem(this.itemToDelete);
      }
      this.deletedialog = false;
    },

    confirmactivate() {
      if (this.itemToactivate) {
        this.activateItem(this.itemToactivate);
      }
      this.activatedialog = false;
    },
    confirmPerDelete() {
      if (this.itemToPerDelete) {
        this.PerDeleteItem(this.itemToPerDelete);
      }
      this.Perdeletedialog = false;
    },
    viewUserDetails(item) {
      // Redirect to another page with the user ID and current page as parameters
      this.$router.push({ 
        name: "user_view", 
        query: { 
          id: item.id,
          fromPage: this.currentPage 
        } 
      });
    },
    activateItem(user) {
      this.appLoading = true;

      terminateOrActivateUser(user.id, "ACTIVE")
        .then((response) => {
          this.appLoading = false;
          if (response.data.success) {
            this.msg = response.data.message || "User activated successfully";
            this.showSnackBar = true;
            this.getData();
          } else {
            throw new Error(response.data.message || "Failed to activate user");
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.handleApiError(err);
        });
    },
    PerDeleteItem(user) {
      this.appLoading = true;

      deleteUser(user.id)
        .then((response) => {
          this.appLoading = false;
          if (response.data.success) {
            this.msg = response.data.message || "User deleted successfully";
            this.showSnackBar = true;
            this.getData();
          } else {
            throw new Error(response.data.message || "Failed to delete user");
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.handleApiError(err);
        });
    },
    terminateItem(user) {
      this.appLoading = true;

      terminateOrActivateUser(user.id, "INACTIVE")
        .then((response) => {
          this.appLoading = false;
          if (response.data.success) {
            this.msg = response.data.message || "User terminated successfully";
            this.showSnackBar = true;
            this.getData();
          } else {
            throw new Error(
              response.data.message || "Failed to terminate user"
            );
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.handleApiError(err);
        });
    },
    formatDate(dateString) {
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
          // Optionally redirect to login
        } else if (err.response.status === 403) {
          this.msg = "Access denied. Insufficient permissions.";
        } else {
          this.ServerError = false;
          this.msg = err.response.data.message || "An error occurred.";
        }
      } else {
        this.ServerError = true;
        this.msg =
          err.message || "An unexpected error occurred. Please try again.";
      }
      this.showSnackBar = true;
    },
  },
};
</script>

<style scoped>
.dialog-card {
  font-family: interbold;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.dialog-icon {
  animation: pulse 1s infinite alternate;
}

.dialog-button {
  min-width: 120px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  background-color: #fff;
}

.custom-table {
  border-collapse: collapse;
  width: 100%;
}

.nowrap-cell {
  white-space: nowrap !important;
  padding: 12px 16px !important;
}

@keyframes pulse {
  from {
    transform: scale(1);
    opacity: 0.7;
  }

  to {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>
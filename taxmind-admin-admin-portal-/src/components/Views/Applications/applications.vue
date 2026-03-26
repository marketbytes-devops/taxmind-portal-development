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
          <v-flex xs12 sm6 :md7="activeTab === 0" :lg7="activeTab === 0" :md10="activeTab === 1" :lg10="activeTab === 1" text-start align-center pt-2 class="carousalhead">Applications
          </v-flex>
          <v-flex xs12 sm6 md2 lg2 text-end align-center pt-2 class="carousalhead">
            <v-select :hide-details="true" v-model="year" :items="yearArray" clearable item-text="text"
              item-value="value" label="Year" style="font-family: opensansregular" solo dense flat outlined></v-select>
          </v-flex>
          <v-flex v-if="activeTab === 0" xs12 sm6 md3 lg3 text-end align-center pt-2 pl-lg-2 class="carousalhead">
            <v-select :hide-details="true" v-model="status" :items="statusArray" item-text="text" item-value="value"
              label="Status" style="font-family: opensansregular" solo dense flat outlined></v-select>
          </v-flex>
        </v-layout>
        
        <!-- Tabs Section -->
        <v-layout wrap justify-start class="mt-4 mb-2">
          <v-flex xs12 class="d-flex" style="gap: 12px;">
            <v-btn
              :style="activeTab === 0 ? 'background-color: #1A73E9; color: white; font-family: opensansregular; text-transform: none; font-size: 14px;' : 'background-color: white; color: #63667B; font-family: opensansregular; text-transform: none; font-size: 14px; border: 1px solid rgba(99, 102, 123, 0.2);'"
              @click="activeTab = 0"
              depressed
              class="px-6"
              height="40"
            >
              Applications
            </v-btn>
            <v-btn
              :style="activeTab === 1 ? 'background-color: #1A73E9; color: white; font-family: opensansregular; text-transform: none; font-size: 14px;' : 'background-color: white; color: #63667B; font-family: opensansregular; text-transform: none; font-size: 14px; border: 1px solid rgba(99, 102, 123, 0.2);'"
              @click="activeTab = 1"
              depressed
              class="px-6"
              height="40"
            >
              Closed Applications
            </v-btn>
          </v-flex>
        </v-layout>
        
        <v-layout wrap justify-start>
          <v-flex xs12>
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-data-table :headers="headers" :items="applicationList" hide-default-footer :items-per-page="limit"
                  class="elevation-0 cursor-pointer " :style="'cursor: pointer'" @click:row="handleRowClick">
                  <template v-slot:[`item.slno`]="{ index }">
                    <span v-if="currentPage > 1">
                      {{ (currentPage - 1) * limit + index + 1 }}
                    </span>
                    <span v-else>{{ index + 1 }}</span>
                  </template>
                  <!-- <template v-slot:[`item._id`]="{ item }">
                    <v-icon
                      small
                      color="primary"
                      class="ml-1"
                      @click.stop="viewUserDetails(item)"
                    >
                      mdi-eye
                    </v-icon>
                  </template> -->
                  <template v-slot:[`item.user.name`]="{ item }">
                    <div class="d-flex align-center">
                      <span>{{ item.user.name }}</span>
                      <v-img v-if="item.hasUnreadMessages" src="@/assets/iconsets/commentsIcon.svg" max-width="14"
                        class="ml-2 cursor-pointer" />
                    </div>
                  </template>
                </v-data-table>
              </v-flex>
            </v-layout>
            <!-- pagination -->
            <v-layout wrap justify-center pt-2>
              <v-flex xs12>
                <div class="text-center pb-5" v-if="pages > 0">
                  <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
                </div>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import http from "@/api/http";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  mixins: [permissionMixin],
  beforeRouteEnter(to, from, next) {
    next(vm => {
      // If not coming from application-view page, handle tab from query or reset to tab 0
      if (from.name !== 'application-view') {
        const tabFromQuery = to.query.tab ? parseInt(to.query.tab) : null;
        if (tabFromQuery !== null) {
          vm.activeTab = tabFromQuery;
          vm.$store.commit("changeApplicationsActiveTab", tabFromQuery);
        } else {
          vm.activeTab = 0;
          vm.$store.commit("changeApplicationsActiveTab", 0);
          // Set status from query param if provided, otherwise reset to ALL
          const statusFromQuery = to.query.status || "";
          vm.status = statusFromQuery;
          vm.$store.commit("changeApplicationsStatus", statusFromQuery);
        }
      }
    });
  },
  data() {
    const currentYear = new Date().getFullYear();
    // Check if tab is specified in query params (e.g., from dashboard)
    const tabFromQuery = this.$route.query.tab ? parseInt(this.$route.query.tab) : null;
    const activeTab = tabFromQuery !== null ? tabFromQuery : (this.$store.state.applicationsActiveTab || 0);
    
    // For tab 0 (Applications), prioritize query status over store, default to empty (ALL)
    // For tab 1 (Closed Applications), ignore status as it's fixed to refund_completed
    const initialStatus = activeTab === 1 ? "" : (this.$route.query.status || this.$store.state.applicationsStatus || "");
    
    return {
      ServerError: false,
      deletedialog: false,
      keyword: "",
      applicationList: [],
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      status: initialStatus,
      appLoading: false,
      activeTab: activeTab,
      itemToDelete: null,
      headers: [
        { text: "Sl.No", value: "slno", align: "start" },
        { text: "Name", value: "user.name", align: "start" },
        { text: "Email", value: "user.email", align: "start" },
        { text: "Application No", value: "applicationNo", align: "start" },
        { text: "Year", value: "year", align: "start" },
        { text: "PPS Number", value: "user.ppsNumber", align: "start" },
        { text: "Status", value: "status", align: "start" },
      ],
      page: 1,
      currentPage: this.$store.state.currentPage || 1,
      pages: 0,
      limit: 10,
      statusArray: [
        { text: "ALL", value: "" },
        { text: "DRAFT", value: "draft" },
        { text: "SUBMITTED", value: "submitted" },
        { text: "DOCUMENTS UPLOADED PENDING", value: "documents_upload_pending" },
        { text: "DOCUMENTS UPLOADED", value: "documents_uploaded" },
        { text: "DOCUMENT REVIEWED", value: "documents_verified" },
        { text: "PROCESSING", value: "processing" },
        // { text: "REFUND COMPLETED", value: "refund_completed" },
      ],
      year: this.$store.state.applicationsYear || null,
      yearArray: Array.from({ length: currentYear - 2019 }, (_, i) => ({
        text: (2020 + i).toString(),
        value: (2020 + i).toString(),
      })),
    };
  },
  watch: {
    activeTab() {
      this.$store.commit("changeApplicationsActiveTab", this.activeTab);
      this.currentPage = 1;
      this.getData();
    },
    status() {
      this.$store.commit("changeApplicationsStatus", this.status);
      this.currentPage = 1;
      this.getData();
    },
    year() {
      this.$store.commit("changeApplicationsYear", this.year);
      this.currentPage = 1;
      this.getData();
    },
    currentPage() {
      this.$store.commit("changeApplicationsCurrentPage", this.currentPage);
      this.getData();
    },
  },
  mounted() {
    if (this.$store.state.currentPage) {
      this.currentPage = this.$store.state.currentPage;
      this.getData();
    } else {
      this.getData();
    }
  },
  methods: {
    getData() {
      const params = {
        limit: this.limit,
        page: this.currentPage,
        year: this.year,
      };

      // For Closed Applications tab (tab 1)
      if (this.activeTab === 1) {
        params.status = 'refund_completed';
        // params.paymentStatus = 'completed';
      } else {
        // For Applications tab (tab 0)
        params.ignoreRefundCompleted = true;
        if (this.status && this.status.trim() !== "") {
          params.status = this.status.trim().replace(/['"]+/g, "");
        }
      }
      this.appLoading = true;
      http
        .get("applications/all", {
          params,
        })
        .then((response) => {
          this.appLoading = false;
          this.applicationList = response.data.data;
          this.pages = Math.ceil(response.data.metadata.total / this.limit);
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    openDeleteDialog(item) {
      this.itemToDelete = item;
      this.deletedialog = true;
    },
    confirmDelete() {
      if (this.itemToDelete) {
        this.deleteItem(this.itemToDelete);
      }
      this.deletedialog = false;
    },
    handleRowClick(item) {
      // Only allow navigation if user has edit permission

      this.viewUserDetails(item);

    },
    viewUserDetails(item) {
      // Redirect to another page with the user ID as a parameter
      this.$router.push({ name: "application-view", query: { id: item.id } });
    },
    deleteItem(r) {
      var data = {};
      data["id"] = r._id;
      http
        .delete("/v1/admin/user/delete", { data: data })
        .then((response) => {
          this.delete = false;
          this.appLoading = false;
          if (response.data.status) {
            this.msg = response.data.msg;
            this.showSnackBar = true;
            this.getData();
          } else {
            this.msg = response.data.msg;
            this.showSnackBar = true;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
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
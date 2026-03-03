<template>
  <div class="application-page">
    <ServerError v-if="ServerError" />
    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="#1A73E9"
      size="60"
      is-full-screen
    />
    <!-- Global snackbar is used via this.$snackbar.showSuccess/showError -->

    <WelcomeHeader :userName="userName" @create-success="handleCreateSuccess" />

    <!-- Display message if no applications found -->
    <div
      v-if="!appLoading && applicationsList.length === 0"
      class="no-applications"
    >
      <v-card class="text-center pa-8">
        <v-icon size="64" color="grey lighten-1"
          >mdi-file-document-outline</v-icon
        >
        <h3 class="mt-4">No Applications Found</h3>
        <p class="grey--text">
          You haven't created any applications yet. Click "New Claim" to get
          started.
        </p>
      </v-card>
    </div>

    <!-- Display Timeline for each application -->
    <div
      v-for="application in applicationsList"
      :key="application.id"
      class="application-item"
    >
      <Timeline
        @continue-application="handleContinueApplication"
        :isApplicationView="true"
        :applicantData="application"
      />
    </div>

    <!-- Pagination controls below listings -->
    <div v-if="!appLoading && applicationsList.length > 0" class="pagination-controls mt-4">
      <v-row align="center" justify="center">
        <v-col cols="12" class="text-center">
          <v-pagination v-model="page" :length="totalPages" circle total-visible="5"></v-pagination>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import Timeline from "./components/Timeline.vue";
import WelcomeHeader from "../Common/WelcomeHeader.vue";
import ApplicationService from "../../services/application";
export default {
  name: "ApplicationPage",

  components: {
    Timeline,
    WelcomeHeader,
  },

  data() {
    return {
      appLoading: false,
      ServerError: false,
      userName: localStorage.getItem("userName"),
      applicationsList: [],
      applicationData: {},
      // pagination
      page: 1,
      size: 10,
      totalPages: 1,
      totalItems: null,
    };
  },

  mounted() {
    this.fetchApplications();
  },

  methods: {
    async fetchApplications() {
      this.appLoading = true;
      this.ServerError = false;

      try {
        const response = await ApplicationService.getApplications({
          page: this.page,
          size: this.size,
        });

        if (response && response.data) {
          const payload = response.data;

          // Extract applications list and metadata
          let appsList = [];
          let metadata = null;

          if (payload && payload.data && Array.isArray(payload.data)) {
            // Response shape: { data: [...], metadata: {...} }
            appsList = payload.data;
            metadata = payload.metadata || payload.meta || payload.pagination || {};
          } else if (Array.isArray(payload)) {
            // Response is an array
            appsList = payload;
          } else {
            appsList = [];
          }

          this.applicationsList = appsList;

          // Calculate total pages from metadata
          if (metadata && metadata.total !== undefined) {
            this.totalItems = metadata.total;
            this.totalPages = Math.ceil(metadata.total / this.size);
          } else {
            // Fallback if no metadata
            this.totalPages = Math.max(1, Math.ceil((this.totalItems || appsList.length) / this.size));
          }

          // Set the first application as the default if available
          if (this.applicationsList.length > 0) {
            this.applicationData = this.applicationsList[0];
          }
        }

        this.appLoading = false;
      } catch (error) {
        this.appLoading = false;

        if (error.response) {
          if (error.response.status === 500) {
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else if (error.response.status === 401) {
            this.msg = "Unauthorized. Please login again.";
            // Optionally redirect to login
            // this.$router.push('/login');
          } else {
            this.ServerError = false;
            this.msg =
              error.response.data.message || "Failed to load applications.";
          }
        } else {
          this.ServerError = true;
          this.msg = "An unexpected error occurred. Please try again.";
        }

        this.$snackbar.showError(this.msg);
        console.error("Error fetching applications:", error);
      }
    },
    changePage(newPage) {
      this.page = newPage;
      this.fetchApplications();
    },
    handleContinueApplication(applicantData) {
      console.log("handleContinueApplication", applicantData);
      this.$router.push({
        path: "/application-upload",
        query: { id: applicantData.id },
      });
      // this.$emit('continue-application', applicantData);
    },
    handleCreateSuccess(response) {
      console.log("Application created successfully:", response);
      // Optionally refresh the applications list
      this.fetchApplications();
    },
  },
  watch: {
    page() {
      this.fetchApplications();
    },
  },
};
</script>

<style lang="scss" scoped>
$blue: #3073f8;

.application-page {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  font-family: "DM Sans", sans-serif;
}

.application-item {
  margin-bottom: 20px;
}

.no-applications {
  margin-top: 20px;
}

.pagination-controls {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .page-info {
    font-weight: 500;
    color: #333;
  }
}
</style>

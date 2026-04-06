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

    <WelcomeHeader 
      ref="welcomeHeader"
      :userName="userName" 
      :isFirstTime="!appLoading && applicationsList.length === 0"
      @create-success="handleCreateSuccess" 
    />

    <!-- Display message if no applications found -->
    <div
      v-if="!appLoading && applicationsList.length === 0"
      class="no-applications"
    >
      <v-card class="text-center pa-12 welcome-card" flat>
        <v-layout column align-center justify-center class="py-6">
          <div class="welcome-illustration-wrapper mb-8">
            <div class="glow-effect"></div>
            <div class="icon-circle">
              <v-icon size="72" color="#1A73E9">mdi-text-box-plus-outline</v-icon>
            </div>
          </div>
          <h2 class="welcome-title font-weight-bold mb-3">Start Your Tax Refund Journey</h2>
          <p class="welcome-subtitle grey--text text--darken-1 mb-10">
            Welcome to TaxMind! You don't have any active claims yet.<br/>
            Let's get started by creating your first application for a tax refund.
          </p>
          <v-btn 
            x-large 
            color="#1A73E9" 
            dark 
            class="start-claim-btn"
            @click="$refs.welcomeHeader.handleButtonClick()"
            :ripple="false"
          >
            <span class="btn-text">Start My First Claim</span>
            <v-icon right size="20">mdi-arrow-right</v-icon>
          </v-btn>
        </v-layout>
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
.welcome-card {
  border-radius: 20px !important;
  background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
  border: 1px solid rgba(26, 115, 233, 0.08) !important;
  box-shadow: 0 10px 40px rgba(26, 115, 233, 0.05) !important;
  position: relative;
  overflow: hidden;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1A73E9, #64B5F6);
}

.welcome-illustration-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glow-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(26, 115, 233, 0.15) 0%, rgba(26, 115, 233, 0) 70%);
  border-radius: 50%;
  animation: pulse-glow 3s infinite ease-in-out;
}

.icon-circle {
  position: relative;
  z-index: 1;
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(26, 115, 233, 0.1);
}

.welcome-title {
  color: #1e293b;
  font-size: 28px;
  letter-spacing: -0.5px;
}

.welcome-subtitle {
  font-size: 16px;
  line-height: 1.6;
  max-width: 480px;
}

.start-claim-btn {
  border-radius: 12px !important;
  padding: 0 32px !important;
  height: 56px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.3px !important;
  background: linear-gradient(135deg, #1A73E9 0%, #0d47a1 100%) !important;
  box-shadow: 0 8px 20px rgba(26, 115, 233, 0.25) !important;
  transition: all 0.3s ease !important;
}

.start-claim-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(26, 115, 233, 0.35) !important;
}

@keyframes pulse-glow {
  0% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.5;
  }
}
</style>

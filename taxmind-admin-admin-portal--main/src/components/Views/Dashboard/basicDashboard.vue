<template>
  <div style="padding: 50px; padding-top: 20px;">
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-layout wrap justify-start class="my-3 ml-2">
      <v-flex xs12 sm3 md3 lg2 text-start align-center pt-2 class="carousalhead">Dashboard</v-flex>
    </v-layout>

    <!-- <v-layout wrap justify-start  v-if="userRole == 'admin'"> -->
    <v-layout wrap justify-start>
      <v-flex xs12>
        <v-layout wrap justify-start>
          <v-flex xs12 sm6 md4 lg4 pa-2>
            <v-card class="pa-6 elevation-1" rounded="lg" role="button" style="cursor: pointer"
              @click="goToApplicationsStatus('refund_completed')">
              <v-layout wrap justify-center align-center>
                <v-flex xs10 sm9 md9 lg9 class="dashbhead">
                  <div>Approved Applications</div>
                  <div v-if="dashboarddata && dashboarddata.approvedApplications" class="title font-weight-bold"
                    style="color: #6e46e5">
                    {{ dashboarddata.approvedApplications }}
                  </div>
                  <div v-else>0</div>
                </v-flex>
                <v-flex xs2 sm3 md3 lg3 text-center>
                  <v-img width="40px" height="40px" :src="require('@/assets/images/Frame_1.png')"></v-img>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>

          <!-- Second Card -->
          <v-flex xs12 sm6 md4 lg4 pa-2>
            <v-card class="pa-6 elevation-1" rounded="lg" role="button" style="cursor: pointer"
              @click="goToApplicationsStatus('submitted')">
              <v-layout wrap justify-center align-center>
                <v-flex xs10 sm9 md10 lg9 class="dashbhead">
                  <div>Submitted Applications</div>
                  <div v-if="dashboarddata && dashboarddata.submittedApplications" class="title font-weight-bold"
                    style="color: #ff4141">
                    {{ dashboarddata.submittedApplications }}
                  </div>
                  <div v-else>0</div>
                </v-flex>
                <v-flex xs2 sm3 md2 lg3 text-center>
                  <v-img width="40px" height="40px" :src="require('@/assets/images/Frame_2.png')"></v-img>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>

          <v-flex xs12 sm6 md4 lg4 pa-2>
            <v-card class="pa-6 elevation-1" rounded="lg" role="button" style="cursor: pointer"
              @click="goToUsers('active')">
              <v-layout wrap justify-center align-center>
                <v-flex xs10 sm9 md9 lg9 class="dashbhead">
                  <div>Active Users</div>
                  <div v-if="dashboarddata && dashboarddata.activeUsers" class="title font-weight-bold"
                    style="color: #6fd417">
                    {{ dashboarddata.activeUsers }}
                  </div>
                  <div v-else>0</div>
                </v-flex>
                <v-flex xs2 sm3 md3 lg3 text-center>
                  <v-img width="40px" height="40px" :src="require('@/assets/images/Frame_6.png')"></v-img>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>

          <v-flex xs12 sm6 md4 lg4 pa-2>
            <v-card class="pa-6 elevation-1" rounded="lg" role="button" style="cursor: pointer"
              @click="goToApplicationsStatus('documents_verified')">
              <v-layout wrap justify-center align-center>
                <v-flex xs10 sm9 md9 lg9 class="dashbhead">
                  <div>Approved Reviews</div>
                  <div v-if="
                    dashboarddata && dashboarddata.activeApplicationReviews
                  " class="title font-weight-bold" style="color: #fe9822">
                    {{ dashboarddata.activeApplicationReviews }}
                  </div>
                  <div v-else>0</div>
                </v-flex>
                <v-flex xs2 sm3 md3 lg3 text-center>
                  <v-img width="40px" height="40px" :src="require('@/assets/images/Frame_4.png')"></v-img>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>

          <v-flex xs12 sm6 md4 lg4 pa-2>
            <v-card class="pa-6 elevation-1" rounded="lg" role="button" style="cursor: pointer"
              @click="goToApplicationsStatus('documents_uploaded')">
              <v-layout wrap justify-center align-center>
                <v-flex xs10 sm9 md9 lg9 class="dashbhead">
                  <div>Pending Reviews</div>
                  <div v-if="
                    dashboarddata && dashboarddata.pendingApplicationReviews
                  " class="title font-weight-bold" style="color: #cf1ce7">
                    {{ dashboarddata.pendingApplicationReviews }}
                  </div>
                  <div v-else>0</div>
                </v-flex>
                <v-flex xs2 sm3 md3 lg3 text-center>
                  <v-img width="40px" height="40px" :src="require('@/assets/images/Frame_5.png')"></v-img>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>

          <v-flex xs12 sm6 md4 lg4 pa-2>
            <v-card class="pa-6 elevation-1" rounded="lg" role="button" style="cursor: pointer"
              @click="goToUsers('pending')">
              <v-layout wrap justify-center align-center>
                <v-flex xs10 sm9 md9 lg9 class="dashbhead">
                  <div>Pending Users</div>
                  <div v-if="dashboarddata && dashboarddata.pendingUsers" class="title font-weight-bold"
                    style="color: #3adaf6">
                    {{ dashboarddata.pendingUsers }}
                  </div>
                  <div v-else>0</div>
                </v-flex>
                <v-flex xs2 sm3 md3 lg3 text-center>
                  <v-img width="40px" height="40px" :src="require('@/assets/images/Frame_3.png')"></v-img>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-start class="my-3 ml-2">
      <v-flex xs12 sm3 md3 lg2 text-start align-center pt-2 class="carousalhead">Alerts</v-flex>
    </v-layout>
    <v-layout wrap justify-start>
      <v-flex v-for="(card, index) in dashboardCards" :key="index" xs12 sm6 md4 lg4 pa-2>
        <router-link v-if="card.isRouter" :to="card.route" style="text-decoration: none">
          <v-card class="pa-6 elevation-1" rounded="lg" :to="card.route">
            <v-layout wrap justify-center align-center>
              <v-flex xs10 sm9 md9 lg9 class="dashbhead">
                <div>{{ card.title }}</div>
                <div v-if="dashboarddata && dashboarddata[card.key]" class="title font-weight-bold"
                  :style="{ color: card.color }">
                  {{ dashboarddata[card.key] }}
                </div>
                <div v-else>0</div>
              </v-flex>
              <v-flex xs2 sm3 md3 lg3 text-center>
                <v-img width="40px" height="40px" :src="require(`@/assets/images/${card.icon}`)" />
              </v-flex>
            </v-layout>
          </v-card>
        </router-link>

        <v-card v-else class="pa-6 elevation-1" rounded="lg" :to="card.route">
          <v-layout wrap justify-center align-center>
            <v-flex xs10 sm9 md9 lg9 class="dashbhead">
              <div>{{ card.title }}</div>
              <div v-if="dashboarddata && dashboarddata[card.key]" class="title font-weight-bold"
                :style="{ color: card.color }">
                {{ dashboarddata[card.key] }}
              </div>
              <div v-else>0</div>
            </v-flex>
            <v-flex xs2 sm3 md3 lg3 text-center>
              <v-img width="40px" height="40px" :src="require(`@/assets/images/${card.icon}`)" />
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
import http from "@/api/http";
export default {
  data() {
    return {
      dashboarddata: {},
      ServerError: false,
      appLoading: false,
      dashboardCards: [
        {
          title: "Payments Pending",
          key: "pendingPayment",
          color: "#6e46e5",
          icon: "Frame_7.png",
          route: { path: "/Payments", query: { tab: "pending" } },
          isRouter: true,
        },
        {
          title: "Agent Activation Pending",
          key: "agentActivation",
          color: "#ff4141",
          icon: "Frame_8.png",
          route: { path: "/users-list", query: { status: "agent_not_activated" } },
          isRouter: true,
        },
        {
          title: "To Be Filed",
          key: "ToBeFiled",
          color: "#6fd417",
          icon: "Frame_9.png",
          // API expects lowercase 'processing'
          route: { path: "/application-list", query: { status: "processing" } },
          isRouter: true,
        },
        {
          title: "Un Registered Customers",
          key: "UnRegisteredCustomers",
          color: "#fe9822",
          icon: "Frame_10.png",
          route: {
            path: "/customer-support",
            query: { filter: "unregistered" },
          },
          isRouter: true,
        },
      ],
    };
  },

  mounted() {
    this.getData();
  },
  methods: {
    // Navigate to application-list with given status
    goToApplicationsStatus(status) {
      // For refund_completed, navigate to Closed Applications tab (tab 1)
      if (status === 'refund_completed') {
        this.$router.push({
          path: "/application-list",
          query: { tab: 1 },
        });
      } else {
        // For other statuses, navigate to Applications tab (tab 0) with status filter
        this.$router.push({
          path: "/application-list",
          query: { status, page: 1, limit: 10 },
        });
      }
    },

    // Navigate to users-list with given status
    goToUsers(status) {
      // Map 'pending' to 'unverified' for the users list status filter
      const mappedStatus = status === 'pending' ? 'unverified' : status;
      this.$router.push({ path: "/users-list", query: { status: mappedStatus } });
    },

    // Navigate to reviews and rely on review-list page to use query params for API call
    goToReviews(status) {
      this.$router.push({
        path: "/review-list",
        query: { status, page: 1, limit: 10 },
      });
    },

    // Navigate to agent activation
    goToAgentActivation() {
      this.$router.push({ path: "/agent-activation" });
    },

    // Navigate to payments and open pending tab
    goToPayments() {
      // we pass tab=pending and pagination params - target page should handle API call
      this.$router.push({
        path: "/Payments",
        query: {
          tab: "pending",
          page: 1,
          size: 10,
          sortBy: "updatedAt",
          orderBy: "desc",
        },
      });
    },
    getData() {
      this.appLoading = true;
      http
        .get("/admins/dashboard")
        .then((response) => {
          this.appLoading = false;
          if (response.data.success && response.data.data) {
            // Map the new API response structure to existing dashboard data format
            const apiData = response.data.data;
            this.dashboarddata = {
              // Main metrics (already matching)
              approvedApplications: apiData.approvedApplications,
              submittedApplications: apiData.submittedApplications,
              activeUsers: apiData.activeUsers,
              pendingUsers: apiData.pendingUsers,

              // Reviews mapping
              activeApplicationReviews: apiData.approvedReviews,
              pendingApplicationReviews: apiData.pendingReviews,

              // Additional metrics for dashboard cards
              pendingPayment: apiData.paymentsPending,
              agentActivation: apiData.agentActivation,
              ToBeFiled: apiData.toBeFiled,
              UnRegisteredCustomers: apiData.unRegisteredCustomers,
            };
          } else {
            console.warn(
              "Dashboard API response structure unexpected:",
              response.data
            );
            this.dashboarddata = {};
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

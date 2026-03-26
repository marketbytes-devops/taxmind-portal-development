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
          <v-flex xs12 sm6 md10 lg10 text-start align-center pt-2 class="carousalhead">Application Reviews
          </v-flex>
          <v-flex xs12 sm6 md2 lg2 text-end align-center pt-2 class="carousalhead">
            <v-select :hide-details="true" v-model="status" :items="statusArray" item-text="text" item-value="value"
              label="Status" style="font-family: opensansregular" solo dense flat outlined></v-select>
          </v-flex>
        </v-layout>
        <v-layout wrap justify-start>
          <v-flex xs12>
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-data-table :headers="headers" :items="applicationList" hide-default-footer :items-per-page="limit"
                  class="elevation-0" @click:row="viewUserDetails" :style="'cursor: pointer'">
                  <template v-slot:[`item.slno`]="{ index }">
                    <span v-if="currentPage > 1">
                      {{ (currentPage - 1) * limit + index + 1 }}
                    </span>
                    <span v-else>{{ index + 1 }}</span>
                  </template>
                  <template v-slot:[`item._id`]="{ item }">
                    <v-icon small color="primary" class="ml-1" @click.stop="viewUserDetails(item)">
                      mdi-eye
                    </v-icon>
                  </template>
                </v-data-table>
              </v-flex>
            </v-layout>
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
  </div>
</template>

<script>
import http from "@/api/http";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      keyword: "",
      applicationList: [],
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      status: this.$route.query.status || "",
      appLoading: false,
      itemToDelete: null,
      headers: [
        { text: "Sl.No", value: "slno", align: "start" },
        { text: "Application ID", value: "application.applicationNo", align: "start" },
        { text: "Rating", value: "rating", align: "start" },
        { text: "review", value: "review", align: "start" },
        { text: "Status", value: "status", align: "start" },
        { text: "Actions", value: "_id", align: "start", width: "50px" },
      ],
      page: 1,
      currentPage: this.$store.state.currentPage || 1,
      pages: 0,
      limit: 10,
      statusArray: [
        { text: "ALL", value: "" },
        { text: "PENDING", value: "pending" },
        { text: "APPROVED", value: "approved" },
        { text: "REJECTED", value: "rejected" },
      ],
    };
  },
  watch: {
    status() {
      this.getData();
    },
    currentPage() {
      this.$store.commit("changeReviewsCurrentPage", this.currentPage);
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
      this.appLoading = true;
      http
        .get("applications/reviews", {
          params: {
            limit: this.limit,
            page: this.currentPage,
            ...(this.status ? { status: this.status } : {})
          },
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
    viewUserDetails(item) {
      // Redirect to another page with the user ID as a parameter
      this.$router.push({ name: "review-view", query: { id: item.id } });
    },
    deleteItem(r) {
      var data = {};
      data["id"] = r.id;
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
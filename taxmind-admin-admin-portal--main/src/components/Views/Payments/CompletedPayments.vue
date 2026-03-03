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

      <!-- Header Section -->


      <v-layout wrap justify-start class="">
        <v-flex xs12>
          <!-- Table section -->
          <v-layout wrap justify-center>
            <v-flex xs12>
              <v-data-table :headers="headers" :items="paymentsList" class="elevation-0" hide-default-footer
                :items-per-page="limit" :mobile-breakpoint="600" :disable-pagination="true">
                <template v-slot:headerCell="{ header }">
                  <span class="header-cell">{{ header.text }}</span>
                </template>
                <template v-slot:item="{ item, index }">
                  <tr style="cursor: pointer" @click="viewPaymentDetails(item)">
                    <td class="body-cell">
                      <span v-if="currentPage > 1">
                        {{ (currentPage - 1) * limit + index + 1 }}
                      </span>
                      <span v-else>{{ index + 1 }}</span>
                    </td>
                    <td class="body-cell">{{ item.application.applicationNo || item.transactionNo || '-' }}</td>
                    <td class="body-cell">{{ item.user?.name || item.customer || '-' }}</td>
                    <td class="body-cell">{{ item.paymentMethod || item.method || '-' }}</td>
                    <td class="body-cell">{{ item.transactionId || item.transaction || '-' }}</td>
                    <td class="body-cell">{{ formatDate(item.createdAt || item.datetime) }}</td>
                    <td class="body-cell">{{ formatAmount(item.amount) }}</td>
                    <td class="body-cell">{{ item.application?.status || 'COMPLETED' }}</td>
                  </tr>
                </template>
              </v-data-table>
            </v-flex>
          </v-layout>
          <!-- pagination -->

        </v-flex>
      </v-layout>

    </v-layout>
    <v-layout wrap justify-center pt-2>
      <v-flex xs12>
        <div class="text-center pb-5">
          <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
        </div>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import { listcompleted } from "@/api/modules/payments";
import debounce from "lodash/debounce";

export default {
  name: "CompletedPayments",
  props: {
    searchKeyword: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      ServerError: false,
      keyword: "",
      paymentsList: [],
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      isComponentMounted: false,
      headers: [
        { text: "Sl.No", value: "slno", align: "start", width: "80px" },
        { text: "Application No", value: "applicationNo", align: "start" },
        { text: "Customer Name", value: "customer", align: "start" },
        { text: "Payment Method", value: "method", align: "start" },
        { text: "Transaction ID", value: "transaction", align: "start" },
        { text: "Date & Time", value: "datetime", align: "start" },
        { text: "Amount", value: "amount", align: "start" },
        { text: "Status", value: "status", align: "start" },
      ],
      sortOptions: [
        { text: "Latest First", value: "updatedAt" },
        { text: "Amount High to Low", value: "amount" },
        { text: "Customer Name", value: "customerName" },
        { text: "Invoice Number", value: "invoiceNumber" },
      ],
      sortBy: "updatedAt",
      orderBy: "desc",
      currentPage: 1,
      pages: 0,
      limit: 10,
      yearArray: [],
      year: null,
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
    year() {
      // Only trigger API call if component is already mounted
      if (this.isComponentMounted) {
        this.getData();
      }
    },
    // Remove the keyword watcher to prevent duplicate API calls
    searchKeyword(newValue) {
      // Only update keyword without triggering the watcher
      this.$set(this, 'keyword', newValue || "");
      this.currentPage = 1;
      if (this.isComponentMounted) {
        this.getData();
      }
    },
  },
  mounted() {
    this.getData();
    // Set flag after initial data load to prevent duplicate API calls
    this.$nextTick(() => {
      this.isComponentMounted = true;
    });
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
    getData() {
      if (this.keyword === "") {
        this.keyword = null;
      }

      this.appLoading = true;

      // Prepare parameters for API
      const params = {
        page: this.currentPage,
        limit: this.limit,
        keyword: this.keyword,
        sortBy: this.sortBy,
        orderBy: this.orderBy,
      };

      // Add date filtering if year is selected
      if (this.year) {
        params.startDate = `${this.year}-01-01`;
        params.endDate = `${this.year}-12-31`;
      }

      listcompleted(params)
        .then((response) => {
          this.appLoading = false;

          console.log("Completed payments data=", response.data);
          if (response.data && response.data.success) {
            this.paymentsList = response.data.data || [];
            const total = response.data.metadata?.total || this.paymentsList.length;
            this.pages = Math.ceil(total / this.limit);
          } else {
            this.paymentsList = [];
            this.pages = 0;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.handleApiError(err);
        });
    },
    viewPaymentDetails(item) {
      // You can implement payment details view here
      console.log("View payment details:", item);
      // this.$router.push({ name: "payment_view", query: { id: item.id } });
    },
    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    },
    formatAmount(amount) {
      if (!amount) return "-";
      return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
      }).format(amount);

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
.header-cell {
  font-weight: 800;
  font-size: 14px;
  color: #000;
}

.body-cell {
  font-weight: 400;
  font-size: 14px;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 8px 16px;
}

.carousalhead {
  font-family: 'opensansbold';
  font-size: 18px;
  color: #1a73e9;
}

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
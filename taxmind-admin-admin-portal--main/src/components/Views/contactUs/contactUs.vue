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
          <v-flex xs12 sm10 md10 lg10 text-start align-center pt-2 class="carousalhead">Contact Us
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-data-table :headers="headers" :items="supportlist" hide-default-footer :items-per-page="limit"
                  class="elevation-0" style="cursor: pointer">
                  <template v-slot:[`item.slno`]="{ index }">
                    <span v-if="currentPage > 1">
                      {{ (currentPage - 1) * limit + index + 1 }}
                    </span>
                    <span v-else>{{ index + 1 }}</span>
                  </template>
                  <template v-slot:[`item.user`]="{ item }">
                    <div class="d-flex align-center">
                      <div class="text-capitalize">
                        {{ item.user?.name || "-" }}
                      </div>
                      <v-chip v-if="item.unreadCount && item.unreadCount > 0" x-small color="#1A73E9" text-color="white"
                        class="ml-2">
                        {{ item.unreadCount }}
                      </v-chip>
                    </div>
                  </template>
                  <template v-slot:[`item.createdAt`]="{ item }">
                    {{ formatDateTime(item.createdAt) }}
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

    <!-- delete dialog removed for new API (no delete) -->
  </div>
</template>

<script>
import { getContactUs } from "@/api/modules/chat";
export default {
  data() {
    return {
      ServerError: false,
      supportlist: [],
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      headers: [
        { text: "Sl.No", value: "slno", align: "start", width: "10px" },
        { text: "User", value: "name", align: "start", width: "180px" },
        {
          text: "Message",
          value: "message",
          align: "start",
          width: "300px",
        },
        { text: "Email", value: "email", align: "start", width: "80px" },
        { text: "Category", value: "category.name", align: "start", width: "80px" },
        { text: "Date", value: "createdAt", align: "start", width: "140px" },
      ],
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 10,
    };
  },
  watch: {
    currentPage() {
      this.getData();
    },
    keyword() {
      this.currentPage = 1;
      this.getData();
    },
  },
  mounted() {
    this.getData();
  },
  methods: {
    async getData() {
      this.appLoading = true;
      try {
        const { success, data, metadata, message } =
          await getContactUs({
            page: this.currentPage,
            size: this.limit,
          });
        this.appLoading = false;
        if (success) {
          this.supportlist = Array.isArray(data) ? data : [];
          const total = metadata?.total ?? this.supportlist.length;
          this.pages = Math.ceil(total / this.limit);
        } else {
          this.ServerError = false;
          this.msg = message || "Failed to fetch conversations";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        this.ServerError = true;
        this.msg = "An unexpected error occurred. Please try again.";
        this.showSnackBar = true;
        console.log(err);
      }
    },
    onRowClick(item) {
      // Navigate to customer support chat with selected userId
      const userId =
        item?.user?.id || item?.user?.userId || item?.userId || item?.id;
      if (userId) {
        this.$router.push({ name: "customer-support", query: { userId } });
      }
    },
    formatDateTime(dateStr) {
      if (!dateStr) return "";
      const dt = new Date(dateStr);
      return dt.toLocaleString();
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
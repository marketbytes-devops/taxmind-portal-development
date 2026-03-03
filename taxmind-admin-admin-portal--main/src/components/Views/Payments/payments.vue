<template>
  <div class="ma-4">
    <div class="roleHeader Head1 pa-3 d-flex justify-space-between align-center">
      <span>Payments</span>
      <v-text-field v-model="search" placeholder="Search..." prepend-inner-icon="mdi-magnify" outlined dense
        hide-details class="search-input" />
    </div>

    <v-layout wrap justify-center>
      <v-flex xs12>
        <!-- <v-card elevation="0" class="white"> -->
        <v-card elevation="0" class="white pb-1">
          <v-row class="payments-tabs d-flex px-4 pt-4" no-gutters>
            <v-col cols="auto" v-for="(tab, i) in tabs" :key="i" class="pr-2">
              <v-btn v-if="activeTab === tab.value" color="#1A73E9" class="payments-tab-btn" depressed dark
                @click="clearSearchAndSetTab(tab.value)">
                {{ tab.text }}
              </v-btn>
              <v-btn v-else outlined class="payments-tab-btn outlined-visible"
                style="background: #fff; min-width: 120px" @click="clearSearchAndSetTab(tab.value)">
                {{ tab.text }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
        <!-- <v-card elevation="0" class="pa-0" style="overflow-x: auto; background: #fff"> -->
        <CompletedPayments v-if="activeTab === 'completed'" :rows="rows" :searchKeyword="debouncedSearch" />
        <OfflinePayments v-else-if="activeTab === 'offline'" :rows="pendingRows" :searchKeyword="debouncedSearch"
          @approve="handleApprove" @reject="handleReject" />
        <RejectedPayments v-else-if="activeTab === 'rejected'" :rows="rows" :searchKeyword="debouncedSearch" />
        <PendingPayments v-else-if="activeTab === 'pending'" :rows="rows" :searchKeyword="debouncedSearch" />
        <!-- </v-card> -->
        <!-- </v-card> -->
      </v-flex>
    </v-layout>
  </div>
</template>


<script>
// import FilledButton from "@/components/utilities/FilledButton.vue";
// import OutlinedButton from "@/components/utilities/OutlinedButton.vue";
import CompletedPayments from "./CompletedPayments.vue";
import OfflinePayments from "./OfflinePayments.vue";
import RejectedPayments from "./RejectedPaymentsTable.vue";
import PendingPayments from "./PendingPayments.vue";
import debounce from "lodash/debounce";

export default {
  name: "PaymentsPage",
  components: {
    // FilledButton,
    // OutlinedButton,
    CompletedPayments,
    OfflinePayments,
    RejectedPayments,
    PendingPayments
  },
  data() {
    return {
      search: "",
      debouncedSearch: "",
      tabs: [
        { text: "Completed", value: "completed" },


        { text: "Pending", value: "pending" },
        { text: "Offline Payments", value: "offline" },
        // { text: "Rejected", value: "rejected" },
      ],
      // initialize activeTab from route query if present so dashboard links work
      activeTab:
        this.$route && this.$route.query && this.$route.query.tab
          ? this.$route.query.tab
          : "completed",
      rows: [
        {
          invoice: "INV-A14",
          customer: "PRIBIN THOMAS",
          method: "Offline",
          transaction: "-",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A15",
          customer: "CHIRAYATH, JERNET",
          method: "Debit Card",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A16",
          customer: "PERUMTHOTTATHIL..",
          method: "Stripe",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A17",
          customer: "ENTSIWAH, WILLIAM",
          method: "PayPal",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A18",
          customer: "PERUMTHOTTATHIL..",
          method: "Credit Card",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A19",
          customer: "MARTIN, ANJANA",
          method: "Debit Card",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A20",
          customer: "52414MARTIN,..",
          method: "PayPal",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A21",
          customer: "KARUKAYIL...",
          method: "Stripe",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
      ],
      // search: "",
      // debouncedSearch: "",
      pendingRows: [
        {
          invoice: "INV-A14",
          customer: "PRIBIN THOMAS",
          method: "",
          transaction: "",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A15",
          customer: "CHIRAYATH, JERNET",
          method: "",
          transaction: "",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A16",
          customer: "PERUMTHOTTATHIL..",
          method: "",
          transaction: "",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A17",
          customer: "ENTSIWAH, WILLIAM",
          method: "",
          transaction: "",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
      ],
    };
  },
  created() {
    this.debouncedSearchUpdate = debounce((value) => {
      this.debouncedSearch = value;
    }, 500);
  },
  mounted() {
    // If route has a tab query (e.g. ?tab=pending) ensure the component opens that tab
    const tab = this.$route && this.$route.query && this.$route.query.tab;
    if (tab) {
      // reuse existing method to set tab and clear search
      this.clearSearchAndSetTab(tab);
    }
  },
  watch: {
    search(newValue) {
      this.debouncedSearchUpdate(newValue);
    },
    // react to external route changes so links from the dashboard update the active tab
    $route(to) {
      const newTab = to && to.query && to.query.tab;
      if (newTab && newTab !== this.activeTab) {
        this.clearSearchAndSetTab(newTab);
      }
    },
  },
  methods: {
    clearSearchAndSetTab(tabValue) {
      // Set the active tab
      this.activeTab = tabValue;

      // Clear the search input
      this.search = "";

      // Immediately update the debounced search value
      this.debouncedSearch = "";
    },
    handleApprove(row) {
      console.log("Approving payment for:", row);
      // TODO: Implement API call to approve payment
      // Move row from pending to completed
    },
    handleReject(row) {
      console.log("Rejecting payment for:", row);
      // TODO: Implement API call to reject payment
      // Move row from pending to rejected
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

.search-input {
  max-width: 220px;
  /* keeps it compact like your image */
}

.search-input .v-input__control {
  min-height: 36px !important;
  /* height like your screenshot */
}

.search-input input {
  font-size: 14px !important;
  /* match font size */
}

.search-input .v-input__slot {
  border: 1px solid #d9d9d9 !important;
  /* thin border */
  border-radius: 8px;
  /* rounded corners */
}

.search-input .v-icon {
  font-size: 18px;
  /* adjust search icon size */
  margin-right: 4px;
  /* spacing between icon and text */
  color: #5f5f5f;
  /* subtle gray */
}

.search-input ::v-deep input::placeholder {
  font-weight: 400 !important;
  color: #5f5f5f !important;
}
</style>
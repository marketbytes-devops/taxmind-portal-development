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


            <v-layout wrap justify-start>
                <v-flex xs12>
                    <!-- Tabs Section -->
                    <v-tabs v-model="activeTab" background-color="white" color="#1A73E9" class="support-tabs p-3 ">
                        <v-tab>
                            <v-icon left>mdi-credit-card-outline</v-icon>
                            Payment Request
                        </v-tab>
                        <v-tab>
                            <v-icon left>mdi-close-circle-outline</v-icon>
                            Rejected Payments
                        </v-tab>
                    </v-tabs>

                    <!-- Tab Items -->
                    <v-tabs-items v-model="activeTab">
                        <v-tab-item>
                            <!-- Request Payments Table -->
                            <v-layout wrap justify-center>
                                <v-flex xs12>
                                    <v-data-table :headers="headers" :items="paymentsList"
                                        class="elevation-0 pending-table" hide-default-footer :items-per-page="limit"
                                        :mobile-breakpoint="600" :disable-pagination="true">
                                        <template v-slot:item="{ item, index }">
                                            <tr>
                                                <td>
                                                    <span v-if="currentPage > 1">
                                                        {{ (currentPage - 1) * limit + index + 1 }}
                                                    </span>
                                                    <span v-else>{{ index + 1 }}</span>
                                                </td>
                                                <td>{{ item.application.applicationNo || item.invoice || '-' }}</td>
                                                <td>{{ item.user?.name || item.customer || '-' }}</td>
                                                <td>
                                                    <v-chip v-if="item.isJointPayment" color="success" dark x-small>Joint</v-chip>
                                                    <v-chip v-else-if="item.user?.parentId" color="info" dark x-small>Spouse</v-chip>
                                                    <v-chip v-else color="grey lighten-1" dark x-small>Primary</v-chip>
                                                </td>
                                                <td>{{ formatDate(item.createdAt || item.datetime) }}</td>
                                                <td>€{{ item.claimedAmount }}</td>
                                                <td>
                                                    <v-select v-model="item.paymentMethod" :items="paymentMethods"
                                                        item-text="text" item-value="value" solo flat dense outlined
                                                        hide-details placeholder="Select method"
                                                        class="pending-method-select"
                                                        style="min-width: 180px; max-width: 200px; background: #fff"
                                                        :disabled="!canEdit('payments')" />
                                                </td>
                                                <td>
                                                    <v-text-field v-model="item.transactionId" solo flat dense outlined
                                                        hide-details class="pending-transaction-input"
                                                        style="min-width: 180px; max-width: 200px; background: #fff"
                                                        placeholder="Enter Transaction ID"
                                                        :disabled="!canEdit('payments')" />
                                                </td>
                                                <td>
                                                    <div style="white-space: nowrap">
                                                        <v-btn v-if="canEdit('payments')" color="primary" depressed
                                                            :ripple="false" small class="approve-btn"
                                                            @click="approvePayment(item, index)" style="
                            min-width: 86px;
                            height: 36px;
                            font-size: 14px;
                            font-weight: 500;
                            text-transform: none;
                          ">
                                                            Approve
                                                        </v-btn>
                                                        <v-btn v-if="canEdit('payments')" color="error" outlined
                                                            :ripple="false" small class="reject-btn ml-2"
                                                            @click="rejectPayment(item, index)" style="
                            min-width: 86px;
                            height: 36px;
                            font-size: 14px;
                            font-weight: 500;
                            text-transform: none;
                          ">
                                                            Reject
                                                        </v-btn>
                                                    </div>
                                                </td>
                                            </tr>
                                        </template>
                                    </v-data-table>
                                </v-flex>
                            </v-layout>
                            <!-- pagination -->
                            <v-layout wrap justify-center pt-2>
                                <v-flex xs12>
                                    <div class="text-center pb-5">
                                        <v-pagination :length="pages" v-model="currentPage" color="#1A73E9"
                                            circle></v-pagination>
                                    </div>
                                </v-flex>
                            </v-layout>
                        </v-tab-item>

                        <v-tab-item>
                            <!-- Rejected Payments Table -->
                            <RejectedPaymentsTable :searchKeyword="searchKeyword" />
                        </v-tab-item>
                    </v-tabs-items>
                </v-flex>
            </v-layout>

        </v-layout>

        <!-- Reject Dialog -->
        <v-dialog v-model="showRejectPopup" max-width="400" persistent>
            <div class="reject-popup-container">
                <!-- Popup Content -->
                <div class="reject-popup-content-wrapper">
                    <v-layout wrap justify-center>
                        <v-flex shrink py-1>
                            <v-img :src="require('@/assets/iconsets/reject.svg')" width="58" height="58"
                                contain></v-img>
                        </v-flex>
                        <v-flex xs11 class="reject-popup-title">Reject payment ?</v-flex>

                        <!-- Subtitle -->
                        <v-flex xs11 class="reject-popup-subtitle">
                            Please enter reason for rejecting the payment
                        </v-flex>

                        <!-- Dropdown for rejection reason -->
                        <v-flex xs11 class="reject-dropdown-container">
                            <v-select v-model="rejectReasonType" :items="rejectReasonOptions"
                                placeholder="Select reason" outlined dense hide-details background-color="white">
                                <template v-slot:append>
                                    <v-icon color="#5F5F5F">mdi-chevron-down</v-icon>
                                </template>
                            </v-select>
                        </v-flex>

                        <!-- Reason Input (shown when 'Other' is selected) -->
                        <v-flex xs11>
                            <v-textarea v-model="rejectReason" placeholder="Enter reason" outlined hide-details
                                background-color="white" rows="3"></v-textarea>

                            <!-- Error Message -->
                            <div v-if="rejectReasonError" class="reject-error-message">
                                Please enter the reason
                            </div>
                        </v-flex>

                        <!-- Action Buttons -->
                        <v-flex xs11>
                            <div class="reject-popup-buttons">
                                <v-btn class="reject-cancel-btn" depressed :ripple="false" @click="closeRejectPopup">
                                    Cancel
                                </v-btn>
                                <v-btn class="reject-submit-btn" depressed :ripple="false" @click="submitRejectPayment">
                                    Reject
                                </v-btn>
                            </div>
                        </v-flex>
                    </v-layout>
                </div>
            </div>
        </v-dialog>
    </div>
</template>

<script>
import { listpending, approveOfflinePayment, rejectOfflinePayment } from "@/api/modules/payments";
import debounce from "lodash/debounce";
import permissionMixin from '@/mixins/permissionMixin';
import RejectedPaymentsTable from './RejectedPaymentsTable.vue';

export default {
    name: "OfflinePayments",
    components: {
        RejectedPaymentsTable,
    },
    mixins: [permissionMixin],
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
            activeTab: 0,
            headers: [
                { text: "Sl.No", value: "slno", align: "start", width: "80px" },
                { text: "Application No", value: "applicationNo", align: "start" },
                { text: "Customer Name", value: "customer", align: "start" },
                { text: "Account", value: "account", align: "start" },
                { text: "Date & Time", value: "datetime", align: "start" },
                { text: "Amount", value: "amount", align: "start" },
                { text: "Payment Method", value: "method", sortable: false },
                { text: "Transaction ID", value: "transaction", sortable: false },
                { text: "Action", value: "actions", sortable: false },
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
            paymentMethods: [
                { text: "Revolut", value: "revolut" },
                { text: "Bank Transfer", value: "bank_transfer" },
                { text: "Cash", value: "cash" },
                { text: "Cheque", value: "cheque" },
                { text: "Other", value: "other" }
            ],
            // Reject popup data
            showRejectPopup: false,
            rejectReason: "",
            rejectReasonType: "",
            rejectPaymentItem: null,
            rejectPaymentIndex: null,
            rejectReasonError: false,
            rejectReasonOptions: [
                "Invalid payment details",
                "Insufficient documentation",
                "Payment method not supported",
                "Duplicate payment request",
                "Customer verification failed",
                "Other (Please specify)",
            ],
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

            listpending(params)
                .then((response) => {
                    this.appLoading = false;

                    console.log("Pending payments data=", response.data);
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
        approvePayment(item) {
            // Validate required fields
            if (!item.paymentMethod) {
                this.msg = "Please select a payment method";
                this.showSnackBar = true;
                return;
            }
            // Transaction ID is not mandatory for cash and cheque payments
            const paymentMethodsWithoutTransactionId = ['cash', 'cheque'];
            if (!paymentMethodsWithoutTransactionId.includes(item.paymentMethod) && !item.transactionId) {
                this.msg = "Please enter a transaction ID";
                this.showSnackBar = true;
                return;
            }

            // Show loading indicator
            this.appLoading = true;

            // Prepare data for API call
            const approvalData = {
                offlinePaymentRequestId: item.id || item._id,
                paymentMethod: item.paymentMethod.toLowerCase().replace(' ', '_'),
                transactionId: item.transactionId
            };

            // Call API to approve payment
            approveOfflinePayment(approvalData)
                .then(response => {
                    this.appLoading = false;
                    if (response.data && response.data.success) {
                        this.msg = "Payment approved successfully";
                        this.showSnackBar = true;
                        // Refresh data after approval
                        this.getData();
                    } else {
                        this.msg = response.data?.message || "Failed to approve payment";
                        this.showSnackBar = true;
                    }
                })
                .catch(err => {
                    this.appLoading = false;
                    this.handleApiError(err);
                });
        },
        rejectPayment(item, index) {
            // Store the item and index for later use
            this.rejectPaymentItem = item;
            this.rejectPaymentIndex = index;
            // Reset form data
            this.rejectReason = "";
            this.rejectReasonType = "";
            this.rejectReasonError = false;
            // Show the reject dialog
            this.showRejectPopup = true;
        },
        closeRejectPopup() {
            this.showRejectPopup = false;
            this.rejectReason = "";
            this.rejectReasonType = "";
            this.rejectReasonError = false;
            this.rejectPaymentItem = null;
            this.rejectPaymentIndex = null;
        },
        submitRejectPayment() {
            // Validate if reason is empty (mandatory field)
            if (!this.rejectReason.trim()) {
                this.rejectReasonError = true;
                this.msg = "Please enter a reason for rejection";
                this.showSnackBar = true;
                return;
            }

            // Reset error state if validation passes
            this.rejectReasonError = false;

            // Get the rejection reason text
            const reasonText = this.rejectReason.trim();

            // Prepare data for API call
            const rejectionData = {
                offlinePaymentRequestId: this.rejectPaymentItem.id || this.rejectPaymentItem._id,
                rejectionReason: reasonText
            };

            // Add rejectionCategory if available
            if (this.rejectReasonType && this.rejectReasonType.trim() !== "") {
                rejectionData.rejectionCategory = this.rejectReasonType;
            }

            // Show loading indicator
            this.appLoading = true;

            // Call API to reject payment
            rejectOfflinePayment(rejectionData)
                .then(response => {
                    this.appLoading = false;
                    if (response.data && response.data.success) {
                        // Close dialog and show success message
                        this.closeRejectPopup();
                        this.msg = "Payment rejected successfully";
                        this.showSnackBar = true;
                        // Refresh data after rejection
                        this.getData();
                    } else {
                        this.closeRejectPopup();
                        this.msg = response.data?.message || "Failed to reject payment";
                        this.showSnackBar = true;
                    }
                })
                .catch(err => {
                    this.appLoading = false;
                    this.closeRejectPopup();
                    this.handleApiError(err);
                });
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
        // formatAmount(amount) {
        //     if (!amount) return "-";
        //     return new Intl.NumberFormat("en-IE", {
        //         style: "currency",
        //         currency: "EUR",
        //     }).format(amount);
        // },
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
.pending-table {
    /* border-radius: 8px;
  border: 1px solid #e5e5e5; */
    background: #fff;
    font-family: "DM Sans", sans-serif;
}

.body-cell {
    font-weight: 400;
    font-size: 14px;
    color: #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 12px 16px;
}

.header-cell {
    font-weight: 800;
    font-size: 14px;
    color: #000;
}

.carousalhead {
    font-family: 'opensansbold';
    font-size: 18px;
    color: #1a73e9;
}

/* Reject Dialog Styles */
.reject-popup-container {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.reject-popup-content-wrapper {
    text-align: center;
}

.reject-popup-title {
    font-family: 'opensansbold';
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 16px 0 8px 0;
    text-align: center;
}

.reject-popup-subtitle {
    font-family: 'opensansregular';
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
    text-align: center;
}

.reject-dropdown-container {
    margin-bottom: 16px;
}

.reject-error-message {
    color: #d32f2f;
    font-size: 12px;
    margin-top: 4px;
    text-align: left;
}

.reject-popup-buttons {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    justify-content: center;
}

.reject-cancel-btn {
    background-color: #f5f5f5 !important;
    color: #666 !important;
    border: 1px solid #ddd !important;
    font-family: 'opensansregular';
    font-weight: 500;
    text-transform: none;
    min-width: 100px;
    height: 40px;
}

.reject-submit-btn {
    background-color: #d32f2f !important;
    color: white !important;
    font-family: 'opensansregular';
    font-weight: 500;
    text-transform: none;
    min-width: 100px;
    height: 40px;
}

.reject-cancel-btn:hover {
    background-color: #e0e0e0 !important;
}

.reject-submit-btn:hover {
    background-color: #b71c1c !important;
}

/* Apply row padding consistently to ALL cells, including the action column */
/* Apply row padding to ALL table cells */
.pending-table>>>tr {
    height: auto !important;
    /* allow padding to define row height */
}

.pending-table>>>td {
    padding-top: 14px !important;
    padding-bottom: 14px !important;
    vertical-align: middle !important;
}

/* Override the action column (last cell) */
.pending-table>>>td:last-child {
    padding-top: 14px !important;
    padding-bottom: 14px !important;
}

.pending-table>>>td:last-child .d-flex {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}



.pending-method-select .v-input__slot,
.pending-transaction-input .v-input__slot {
    border: 1px solid #e5e5e5 !important;
    border-radius: 6px !important;
    background: #fff !important;
    min-height: 36px !important;
    font-family: "DM Sans", sans-serif !important;
    font-size: 14px !important;
}

.approve-btn {
    background-color: #1a73e9 !important;
    color: white !important;
}

.reject-btn {
    border-color: #d53e3e !important;
    color: #d53e3e !important;
}

/* Vue 2 deep selectors: paste in <style scoped> */
.pending-method-select>>>.v-input__control,
.pending-method-select>>>.v-input__slot,
.pending-transaction-input>>>.v-input__control,
.pending-transaction-input>>>.v-input__slot {
    min-height: 36px !important;
    height: 36px !important;
    padding: 0 !important;
    box-sizing: border-box !important;
}

.pending-method-select>>>.v-select__selections,
.pending-method-select>>>.v-input__slot input,
.pending-transaction-input>>>.v-input__slot input {
    min-height: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    padding: 0 8px !important;
    box-sizing: border-box !important;
}

.pending-method-select>>>.v-input__append-inner,
.pending-method-select>>>.v-input__prepend-inner,
.pending-transaction-input>>>.v-input__append-inner,
.pending-transaction-input>>>.v-input__prepend-inner {
    height: 36px !important;
    display: flex !important;
    align-items: center !important;
    padding: 0 6px !important;
}

.pending-method-select>>>.v-messages,
.pending-transaction-input>>>.v-messages {
    display: none !important;
}

.approve-btn,
.reject-btn {
    height: 36px !important;
    min-width: 86px !important;
    line-height: 36px !important;
    padding: 0 12px !important;
}

/* Tab styles */
.support-tabs {
    font-family: "DM Sans", sans-serif;
}

.support-tabs>>>.v-tab {
    font-family: "DM Sans", sans-serif;
    font-weight: 500;
    text-transform: none;
    font-size: 14px;
    color: #666;
}

.support-tabs>>>.v-tab--active {
    color: #1A73E9 !important;
}

.support-tabs>>>.v-tabs-slider {
    background-color: #1A73E9 !important;
}
</style>
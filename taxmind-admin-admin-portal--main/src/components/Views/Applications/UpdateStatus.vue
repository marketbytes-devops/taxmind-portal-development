<template>
  <v-card elevation="0" class="white">
    <!-- Error handling -->
    <ServerError v-if="ServerError" />

    <!-- Loading overlay -->
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="primary" size="60" is-full-screen />

    <!-- Snackbar notifications -->
    <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: white">{{ msg }}</span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this file? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" text @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Warning Dialog for Completed Status -->
    <v-dialog v-model="showWarningDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="headline warning--text">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Cannot Edit
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-1">
            This application has been marked as <strong>Refund Completed</strong>.
            No further edits can be made to the status or refund amount.
          </p>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showWarningDialog = false">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Submit Confirmation Dialog -->
    <v-dialog v-model="showSubmitConfirmation" max-width="400" persistent>
      <div class="submit-confirmation-container">
        <div class="submit-confirmation-content-wrapper">
          <v-layout wrap justify-center>
            <v-flex shrink py-1>
              <v-icon size="58" color="#FF9800">mdi-alert-circle-outline</v-icon>
            </v-flex>
            <v-flex xs11 class="submit-confirmation-title">Submit Application?</v-flex>

            <!-- Warning Message -->
            <v-flex xs11 class="submit-confirmation-subtitle">
              <strong>Warning:</strong> Once the application is submitted, it cannot be undone. The status and refund
              amount will be finalized.
            </v-flex>

            <!-- Action Buttons -->
            <v-flex xs11>
              <div class="submit-confirmation-buttons">
                <v-btn class="submit-cancel-btn" depressed :ripple="false" @click="cancelSubmit">
                  Cancel
                </v-btn>
                <v-btn class="submit-confirm-btn" color="primary" depressed :ripple="false" @click="confirmSubmit"
                  :loading="submitLoading">
                  Submit
                </v-btn>
              </div>
            </v-flex>
          </v-layout>
        </div>
      </div>
    </v-dialog>

    <!-- Main Content -->
    <v-layout wrap justify-start>
      <v-flex xs12>
        <!-- Page Header -->
        <v-layout wrap pa-4>
          <v-flex xs12>
            <h1 class="Head2 mb-4">Update Status</h1>
          </v-flex>

          <!-- Show Refund Completed Status -->
          <v-flex xs12 v-if="isRefundCompleted">
            <v-alert type="success" outlined border="left" class="mb-0">
              <v-layout align-center>
                <!-- <v-icon color="success" class="mr-2">mdi-check-circle</v-icon> -->
                <span class="text-h6">Refund Completed</span>
              </v-layout>
            </v-alert>
          </v-flex>

          <!-- Show form fields only if not refund completed -->
          <template v-if="!isRefundCompleted">
            <v-flex xs12 sm6 md3 lg2 xl2 pt-2 pt-sm-0 px-2>
              <label class="form-label">Select status</label>
              <v-select v-model="selectedStatus" :items="statusOptions" item-text="label" item-value="value" outlined
                flat dense hide-details placeholder="select status" @change="onStatusChange"></v-select>
            </v-flex>
            <v-flex xs12 sm6 md3 lg2 xl2 pt-2 pt-sm-0 px-2>
              <label class="form-label">Enter refund amount</label>
              <v-text-field v-model="refundAmount" outlined flat dense type="number" hide-details class="refund-input"
                prefix="€" placeholder="1000" :disabled="selectedStatus !== 'approved'" @input="onRefundAmountChange"></v-text-field>
            </v-flex>
            <v-flex xs12 sm6 md4 lg3 xl3 pt-2 pt-sm-0 px-2 v-if="selectedStatus === 'approved'">
              <label class="form-label">Payment Type</label>
              <v-radio-group v-model="paymentType" row hide-details class="payment-type-radio mt-1" @change="onPaymentTypeChange">
                <v-radio label="Commission" value="commission" color="primary"></v-radio>
                <v-radio label="Flat Fee" value="flatfee" color="primary"></v-radio>
              </v-radio-group>
            </v-flex>
            <v-flex xs12 sm6 md3 lg2 xl2 pt-2 pt-sm-0 px-2 v-if="selectedStatus === 'approved' && paymentType === 'flatfee'">
              <label class="form-label">Enter flat fee</label>
              <v-text-field v-model="flatFeeAmount" outlined flat dense type="number" hide-details class="refund-input"
                prefix="€" placeholder="1000" :disabled="!refundAmount"></v-text-field>
            </v-flex>
            <v-flex xs12 sm6 md3 lg2 xl2 pt-2 pt-sm-0 px-2 d-flex align-end v-if="paymentType === 'commission'">
              <v-btn color="primary" :ripple="false" depressed height="40px" class="calculate-button" block
                @click="calculateAmount"
                :disabled="!canCalculate || selectedStatus !== 'approved' || !canEdit('applications')">
                Calculate
              </v-btn>
            </v-flex>

            <!-- Hint for Pending Status -->
            <v-flex xs12 v-if="selectedStatus === 'pending'">
              <v-alert type="info" outlined border="left" class="mt-4 mb-0" dense>
                <v-layout align-center>
                  <!-- <v-icon color="info" class="mr-2" size="20">mdi-information</v-icon> -->
                  <span style="font-size: 14px;">Please select <strong>"Approved"</strong> status to enter refund amount
                    and continue with the calculation.</span>
                </v-layout>
              </v-alert>
            </v-flex>
          </template>
        </v-layout>

        <!-- Top Section: Status Selection, Refund Amount and Calculate Button -->

        <!-- Amount Details Card - Commission Mode -->
        <v-layout wrap px-4 v-if="paymentType === 'commission' && (showResults || isRefundCompleted)">
          <v-flex xs12 sm12 md8 lg8 xl6>
            <!-- Debug info -->

            <v-card elevation="0" outlined style="border-radius: 4px">
              <div class="card-header">
                <h3 class="card-title">Amount Details</h3>
              </div>

              <div class="card-content">

                <div class="detail-item">
                  <v-layout wrap align-center justify-space-between>
                    <v-flex>
                      <span class="detail-label">Refund Amount</span>
                    </v-flex>
                    <v-flex shrink>
                      <span class="detail-value">€</span><span class="detail-amt">{{ calculationResponse ?
                        calculationResponse.refundAmount : 0
                      }}</span>
                    </v-flex>
                  </v-layout>
                </div>

                <!-- Commission breakdown - only show for commission mode -->
                <div class="detail-item">
                  <v-layout wrap align-center justify-space-between>
                    <v-flex>
                      <span class="detail-label">Commission Amount</span>
                    </v-flex>
                    <v-flex shrink>
                      <span class="detail-value">€</span><span class="detail-amt">{{ calculationResponse.commissionAmount || 0 }}</span>
                    </v-flex>
                  </v-layout>
                </div>
                <div class="detail-item">
                  <v-layout wrap align-center justify-space-between>
                    <v-flex>
                      <span class="detail-label">Commission Percentage</span>
                    </v-flex>
                    <v-flex shrink>
                      <span class="detail-value"></span><span class="detail-amt">{{
                        this.calculationResponse.commissionPercentage || 0 }}%</span>
                    </v-flex>
                  </v-layout>
                </div>

                <div class="detail-item">
                  <v-layout wrap align-center justify-space-between>
                    <v-flex>
                      <span class="detail-label">Total Commission Amount</span>
                    </v-flex>
                    <v-flex shrink>
                      <span class="detail-value">€</span><span class="detail-amt">{{
                        this.calculationResponse.totalCommissionAmount || 0 }}</span>
                    </v-flex>
                  </v-layout>
                </div>


                <div class="detail-item">
                  <v-layout wrap align-center justify-space-between>
                    <v-flex>
                      <span class="detail-label">VAT Amount</span>
                    </v-flex>
                    <v-flex shrink>
                      <span class="detail-value">€</span><span class="detail-amt">{{ this.calculationResponse.vatAmount
                        || 0 }}</span>
                    </v-flex>
                  </v-layout>
                </div>

                <div class="detail-item">
                  <v-layout wrap align-center justify-space-between>
                    <v-flex>
                      <span class="detail-label">VAT Percentage</span>
                    </v-flex>
                    <v-flex shrink>
                      <span class="detail-value"></span><span class="detail-amt">{{
                        this.calculationResponse.vatPercentage || 0 }}%</span>
                    </v-flex>
                  </v-layout>
                </div>
                <!-- Special Discount Row -->
              </div>
            </v-card>
          </v-flex>
        </v-layout>

        <!-- Flat Fee Mode - Simple Display -->
        <v-layout wrap px-4 v-if="paymentType === 'flatfee' && flatFeeAmount && !isRefundCompleted">
          <v-flex xs12 sm12 md8 lg8 xl6>
            <v-card elevation="0" outlined style="border-radius: 4px">
              <div class="card-header">
                <h3 class="card-title">Amount Details</h3>
              </div>
              <div class="card-content">
                <div class="detail-item">
                  <v-layout wrap align-center justify-space-between>
                    <v-flex>
                      <span class="detail-label">Flat Fee Amount</span>
                    </v-flex>
                    <v-flex shrink>
                      <span class="detail-value">€</span><span class="detail-amt">{{ flatFeeAmount || 0 }}</span>
                    </v-flex>
                  </v-layout>
                </div>
              </div>
            </v-card>
          </v-flex>
        </v-layout>

        <!-- Discount Amount Section - Shows for both Commission and Flat Fee -->
        <v-layout wrap px-4 v-if="showResults || isRefundCompleted || (paymentType === 'flatfee' && flatFeeAmount)">
          <v-flex xs12 sm12 md8 lg8 xl6>
            <v-card elevation="0" outlined style="border-radius: 4px" class="mt-4 pa-4" rounded="md">
              <v-layout wrap align-center justify-space-between>
                <v-flex>
                  <span class="detail-label">Discount Amount</span>
                </v-flex>
                <v-flex shrink>
                  <v-text-field v-model="discountAmount" outlined flat dense type="number" hide-details
                    class="discount-input-card" prefix="€" placeholder="0" @input="validateDiscount"
                    style="max-width: 120px;" :disabled="isRefundCompleted"></v-text-field>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>
        </v-layout>

        <!-- Final Amount Section -->
        <v-layout mb-5 wrap v-if="showResults || isRefundCompleted || (paymentType === 'flatfee' && flatFeeAmount)">
          <v-flex xs12 sm12 md8 lg8 xl6 pa-4>
            <v-layout wrap>
              <v-flex>
                <h2 class="Head4">Final Amount</h2>
              </v-flex>
              <v-flex shrink>
                <span style="color: #3b82f6;" class="Head4 ">€ {{ finalAmount.toFixed(2) }}</span>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex xs11 px-4>
            <v-divider></v-divider>
          </v-flex>
        </v-layout>

        <!-- Upload Tax Return Section -->
        <v-layout mt-4 wrap v-if="(showResults || (paymentType === 'flatfee' && flatFeeAmount)) && !isRefundCompleted">
          <v-flex xs12 sm12 md6 lg4 xl3 pa-4>
            <div>
              <h3 class="upload-title">Upload Tax Return</h3>
              <p class="upload-subtitle">Submit your completed tax documents</p>

              <!-- Upload Button (Figma Design) -->
              <div v-if="!uploadedFile" class="upload-button-container">
                <input ref="fileInput" type="file" accept=".pdf,.doc,.docx" style="display: none"
                  @change="handleFileUpload" :disabled="!canEdit('applications')" />
                <v-btn class="upload-button-figma" color="#E6F3FF" text small @click="triggerFileUpload"
                  :disabled="!canEdit('applications')">
                  <v-icon color="#2B7DE9" size="16" class="mr-2">mdi-plus</v-icon>
                  <span class="upload-button-text">Upload</span>
                </v-btn>
              </div>

              <!-- Uploaded File Display (Figma Design) -->
              <div v-if="uploadedFile" class="uploaded-file-figma">
                <v-layout wrap align-center justify-space-between>
                  <v-flex xs8>
                    <v-icon color="#6B7280" size="20">mdi-file-document-outline</v-icon>
                    <span class="file-name-figma">{{ uploadedFile.name }}</span>
                  </v-flex>
                  <v-flex shrink text-right>
                    <v-icon color="#10B981" size="20">mdi-check-circle</v-icon>

                    <v-btn v-if="canEdit('applications')" icon small class="delete-file-btn"
                      @click="showDeleteConfirmation">
                      <v-icon color="#EF4444" size="18">mdi-delete-outline</v-icon>
                    </v-btn>
                  </v-flex>
                </v-layout>
              </div>

              <!-- Maya & AI Processing Section -->
              <div v-if="uploadedFile && !automatedSummary" class="mt-4">
                <v-btn color="secondary" depressed block :loading="processingMaya" @click="processWithMaya" :disabled="!canEdit('applications')">
                  <v-icon left>mdi-auto-fix</v-icon>
                  Process with Maya & AI
                </v-btn>
              </div>
            </div>
          </v-flex>
        </v-layout>

        <!-- Automated Summary Section (Post-Processing) -->
        <v-layout mt-4 wrap v-if="automatedSummary && !finalSummaryConfirmed">
           <v-flex xs12 sm12 md8 lg8 xl6 pa-4>
              <v-card elevation="0" outlined style="border-radius: 4px" class="pa-4 bg-light-blue">
                <h3 class="card-title mb-2">Automated Document Summary</h3>
                <p class="text-caption grey--text mb-4">Generated via Maya Anonymization & OpenAI</p>
                
                <v-textarea
                  v-model="editableSummary"
                  outlined
                  label="Edit Summary"
                  rows="10"
                  counter
                  class="summary-editor"
                  :disabled="!canEdit('applications')"
                ></v-textarea>

                <div class="d-flex justify-end mt-4">
                  <v-btn
                    v-if="maskedFileUrl"
                    color="secondary"
                    outlined
                    depressed
                    class="mr-4"
                    tag="a"
                    :href="maskedFileUrl"
                    target="_blank"
                  >
                    <v-icon left>mdi-eye</v-icon>
                    Preview Masked Document
                  </v-btn>
                  <v-btn color="primary" depressed @click="confirmFinalSummary" :loading="confirmingSummary" :disabled="!canEdit('applications')">
                    Confirm & Send to Client
                  </v-btn>
                </div>
              </v-card>
           </v-flex>
        </v-layout>

        <!-- Submit Button -->
        <v-layout wrap v-if="showSubmitButton && !isRefundCompleted">
          <v-flex xs12 sm6 md4 lg3 xl2 px-4 pb-4>
            <v-btn color="primary" :ripple="false" dark height="40px" @click="submitStatus" class="calculate-button"
              :disabled="!canSubmit || !canEdit('applications')">
              Submit
            </v-btn>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>

import ServerError from "@/components/Common/500.vue";
import { calculateAmount, submitAmount, processTaxReturn, confirmTaxReturn } from "@/api/modules/applications";
import { files } from "@/api";
import { deleteFile } from "@/api/modules/files";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  name: "UpdateStatus",
  mixins: [permissionMixin],
  components: {
    ServerError,
  },

  data() {
    return {
      // Loading and UI states
      appLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      ServerError: false,
      uploadedFileInfo: null,
      showDeleteDialog: false,
      showWarningDialog: false,
      showSubmitConfirmation: false,
      submitLoading: false,
      // Form data
      selectedStatus: 'pending',
      refundAmount: null,
      discountAmount: null,
      uploadedFile: null,
      paymentType: 'commission',
      flatFeeAmount: null,


      // Status options
      statusOptions: [
        { label: "Refund Approved", value: "approved" },
        { label: "Pending", value: "pending" },
      ],

      // Calculation results
      showResults: false,
      calculationResponse: null,
      calculationDetails: null,
      apiDiscountAmount: 0,
      apiFinalAmount: 0,

      // Maya & AI Integration states
      processingMaya: false,
      automatedSummary: null,
      editableSummary: "",
      confirmingSummary: false,
      finalSummaryConfirmed: false,
      maskedFileId: null,
      maskedFileUrl: null,

    };
  },

  mounted() {
    this.loadApplicationData();
  },
  watch: {
    // Watch for changes in applicantdata prop to update the component
    applicantdata: {
      handler(newData) {
        if (newData) {
          this.loadApplicationData();
        }
      },
      deep: true
    }
  },
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isRefundCompleted() {
      return this.applicantdata && this.applicantdata.status === 'refund_completed';
    },

    showRefundInput() {
      return (
        this.selectedStatus === "approved" ||
        this.selectedStatus === "completed"
      );
    },

    canCalculate() {
      if (this.showRefundInput) {
        return this.selectedStatus && this.refundAmount;
      }
      return this.selectedStatus;
    },

    finalAmount() {
      // For refund completed status, use the stored finalAmount from API
      if (this.isRefundCompleted && this.applicantdata && this.applicantdata.finalAmount !== undefined) {
        return parseFloat(this.applicantdata.finalAmount) || 0;
      }

      // For commission mode with calculation response
      if (this.paymentType === 'commission' && this.calculationResponse) {
        const discountAmount = parseFloat(this.discountAmount) || 0;
        
        // Use finalAmount from API response if available, then subtract discount
        if (this.calculationResponse.finalAmount !== undefined && this.calculationResponse.finalAmount !== null) {
          const apiFinalAmount = parseFloat(this.calculationResponse.finalAmount) || 0;
          return Math.max(0, apiFinalAmount - discountAmount);
        }
        
        // Fallback calculation if finalAmount not in response
        const refundAmount = parseFloat(this.calculationResponse.refundAmount) || 0;
        const totalCommissionAmount = parseFloat(this.calculationResponse.totalCommissionAmount) || 0;
        return Math.max(0, refundAmount - totalCommissionAmount - discountAmount);
      }

      // For flat fee mode - calculate locally
      if (this.paymentType === 'flatfee' && this.flatFeeAmount) {
        const flatFee = parseFloat(this.flatFeeAmount) || 0;
        const discount = parseFloat(this.discountAmount) || 0;
        return Math.max(0, flatFee - discount);
      }

      return 0;
    },

    canSubmit() {
      // For flat fee mode, require flat fee amount to be entered
      if (this.paymentType === 'flatfee') {
        return this.flatFeeAmount && this.selectedStatus;
      }
      // For commission mode, require calculation response
      return this.calculationResponse && this.selectedStatus;
    },

    // calculationDetails() {
    //   // Return empty array if no calculation response is available
    //   if (!this.calculationResponse) return [];

    //   console.log('Generating calculationDetails from response:', this.calculationResponse);

    //   // Create an array of details
    //   const details = [
    //     {
    //       label: "Refund Amount",
    //       value: `€ ${this.calculationResponse.refundAmount || 0}`,
    //     },
    //     {
    //       label: "Commission Amount",
    //       value: `€ ${this.calculationResponse.commissionAmount || 0}`,
    //     },
    //     {
    //       label: "Commission Percentage",
    //       value: `${this.calculationResponse.commissionPercentage || 0}%`,
    //     },
    //     {
    //       label: "Total Commission Amount",
    //       value: `€ ${this.calculationResponse.totalCommissionAmount || 0}`,
    //     },
    //     {
    //       label: "VAT Amount",
    //       value: `€ ${this.calculationResponse.vatAmount || 0}`,
    //     },
    //     {
    //       label: "VAT Percentage",
    //       value: `${this.calculationResponse.vatPercentage || 0}%`,
    //     },
    //   ];

    //   console.log('Generated calculationDetails:', details);
    //   return details;
    // },

    showSubmitButton() {
      // For flat fee mode, require refund amount and flat fee amount
      if (this.paymentType === 'flatfee') {
        return this.refundAmount && this.flatFeeAmount;
      }
      // For commission mode, require calculation to be done
      return this.showResults && this.calculationResponse;
    },
  },

  methods: {
    onStatusChange() {
      if (this.isRefundCompleted) {
        this.showWarningDialog = true;
        return;
      }

      // If switching to pending, clear all fields and hide results
      if (this.selectedStatus === 'pending') {
        this.showResults = false;
        this.refundAmount = null;
        this.discountAmount = null;
        this.uploadedFile = null;
        this.calculationResponse = null;
      } else {
        // For other statuses, just reset the form
        this.showResults = false;
        this.refundAmount = null;
        this.uploadedFile = null;
      }
    },

    async calculateAmount() {
      if (this.isRefundCompleted) {
        this.showWarningDialog = true;
        return;
      }

      try {
        if (!this.selectedStatus || !this.refundAmount) {
          this.msg = "Please select status and enter refund amount";
          this.showSnackBar = true;
          return;
        }

        this.appLoading = true;

        // Get application ID from route params
        // this.applicationId = this.applicantdata.id;
        // Prepare calculation data
        const calculationData = {
          refundAmount: parseFloat(this.refundAmount),
          status: this.selectedStatus
        };

        try {
          // Call the API
          const response = await calculateAmount(this.applicantdata.id, calculationData);

          if (response && response.data && response.data.data) {
            // Store the calculation data from the API response
            this.calculationResponse = response.data.data;
            console.log('API Calculation response:', this.calculationResponse);
          } else {
            throw new Error("Invalid API response format");
          }
        } catch (apiError) {
          console.warn('API error or mock mode, using mock data:', apiError);

          // For testing: Use mock data that matches the expected API response format
          this.calculationResponse = {
            refundAmount: parseFloat(this.refundAmount),
            commissionAmount: 110,
            commissionPercentage: 11,
            totalCommissionAmount: 146.3,
            vatAmount: 36.3,
            vatPercentage: 33,
            discountAmount: 0,
            finalAmount: parseFloat(this.refundAmount) - 146.3
          };

          console.log('Using mock calculation data:', this.calculationResponse);
        }

        // Force update to ensure computed properties are recalculated
        this.$forceUpdate();

        // Show results
        this.showResults = true;
        this.msg = "Calculation completed successfully";
        this.showSnackBar = true;

        this.appLoading = false;
      } catch (error) {
        this.appLoading = false;
        this.msg = "Error calculating amount";
        this.showSnackBar = true;
        console.error("Calculation error:", error);
      }
    },

    triggerFileUpload() {
      this.$refs.fileInput.click();
    },

    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        this.appLoading = true;
        const response = await files.uploadFile(this.applicantdata.id, file, 'tax_return_document');
        this.appLoading = false;

        if (response && response.success) {
          // Set uploaded file display info
          this.uploadedFile = {
            name: file.name,
            size: file.size,
            file: file,
          };

          // Store the file information for deletion
          this.uploadedFileInfo = {
            key: response.key || response.fileId,
            fileId: response.fileId || response.key,
            url: response.url,
            type: response.type || 'tax_return_document',
            presignedExpiresIn: response.presignedExpiresIn
          };

          // Show success notification
          this.msg = "File uploaded successfully.";
          this.showSnackBar = true;
        } else {
          this.msg = "File upload failed. Please try again.";
          this.showSnackBar = true;
        }
      } catch (error) {
        this.appLoading = false;
        this.msg = error.response?.data?.error || "File upload failed. Please try again.";
        this.showSnackBar = true;
        console.error("Upload error:", error);
      }
    },

    showDeleteConfirmation() {
      this.showDeleteDialog = true;
    },

    async confirmDelete() {
      try {
        this.showDeleteDialog = false;
        this.appLoading = true;

        // Call the delete API if we have the file info
        if (this.uploadedFileInfo) {
          const fileId = this.uploadedFileInfo.fileId || this.uploadedFileInfo.key;
          const fileType = this.uploadedFileInfo.type || 'tax_return_document';

          if (fileId) {
            await deleteFile(fileId, fileType);
          }
        }

        // Clear the uploaded file data
        this.uploadedFile = null;
        this.uploadedFileInfo = null;

        // Clear the file input
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }

        this.appLoading = false;
        this.msg = "File deleted successfully";
        this.showSnackBar = true;
      } catch (error) {
        this.appLoading = false;
        this.msg = error.response?.data?.error || "Error deleting file";
        this.showSnackBar = true;
        console.error("Delete error:", error);
      }
    },

    removeUploadedFile() {
      this.uploadedFile = null;
      this.uploadedFileInfo = null;
      this.msg = "File removed successfully";
      this.showSnackBar = true;
      // Clear the file input
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },

    async submitStatus() {
      if (this.isRefundCompleted) {
        this.showWarningDialog = true;
        return;
      }

      // Show confirmation dialog instead of submitting directly
      this.showSubmitConfirmation = true;
    },

    cancelSubmit() {
      this.showSubmitConfirmation = false;
    },

    async confirmSubmit() {
      try {
        // Validation: For commission mode, require calculation response
        if (this.paymentType === 'commission' && !this.calculationResponse) {
          this.msg = "Please calculate amount before submitting";
          this.showSnackBar = true;
          return;
        }

        // Validation: For flat fee mode, require flat fee amount
        if (this.paymentType === 'flatfee' && !this.flatFeeAmount) {
          this.msg = "Please enter flat fee amount";
          this.showSnackBar = true;
          return;
        }

        // Validation: Require status to be selected
        if (!this.selectedStatus) {
          this.msg = "Please select a status";
          this.showSnackBar = true;
          return;
        }

        this.submitLoading = true;
        this.appLoading = true;

        // Get application ID from applicant data
        const applicationId = this.applicantdata.id;

        if (!applicationId) {
          throw new Error("Application ID is required");
        }

        // Prepare submit data for the applications/amounts/submit endpoint
        const submitData = {
          applicationId: applicationId,
          refundAmount: parseFloat(this.refundAmount),
          discountAmount: parseFloat(this.discountAmount) || 0,
          status: this.selectedStatus
        };

        // Add flatFee key only for flat fee mode
        if (this.paymentType === 'flatfee') {
          submitData.flatFee = parseFloat(this.flatFeeAmount);
        }

        // Call the API to submit amount calculation
        const response = await submitAmount(submitData);

        // Handle file upload if present
        if (this.uploadedFile && this.uploadedFileInfo) {
          // File has already been uploaded in handleFileUpload method
          // We can associate it with the application if needed
          console.log('File uploaded with info:', this.uploadedFileInfo);
        }

        if (response && response.data) {
          this.msg = response.data.message || "Amount submitted successfully";
          this.showSnackBar = true;

          // Close confirmation dialog
          this.showSubmitConfirmation = false;
          this.submitLoading = false;
          this.appLoading = false;

          // Emit an event to notify parent component
          this.$emit('status-updated', {
            applicationId: applicationId,
            status: this.selectedStatus,
            refundAmount: this.paymentType === 'commission' ? this.calculationResponse.refundAmount : this.refundAmount,
            discountAmount: parseFloat(this.discountAmount) || 0
          });

          this.msg = response.data.message || "Amount submitted successfully";
          this.showSnackBar = true;
          this.submitLoading = false;
          this.appLoading = false;
          this.showSubmitConfirmation = false;

          // Update applicant data locally to reflect changes
          this.applicantdata.status = this.selectedStatus;
          // You might need to refresh the whole page or trigger a parent update
        }
      } catch (error) {
        this.submitLoading = false;
        this.appLoading = false;
        this.showSubmitConfirmation = false;
        this.msg = error.response?.data?.error || "Error submitting amount";
        this.showSnackBar = true;
        console.error("Submit error:", error);
      }
    },

    async processWithMaya() {
      try {
        this.processingMaya = true;
        this.msg = "Starting document anonymization & AI summary generation...";
        this.showSnackBar = true;

        const response = await processTaxReturn(this.applicantdata.id);
        
        if (response && response.data && response.data.data) {
          const { summary, maskedFileId, maskedFileUrl } = response.data.data;
          this.automatedSummary = summary;
          this.editableSummary = summary;
          this.maskedFileId = maskedFileId;
          this.maskedFileUrl = maskedFileUrl;
          this.msg = "Process completed! Please review and edit the summary.";
          this.showSnackBar = true;
        }
      } catch (error) {
        console.error("Maya Processing Error:", error);
        this.msg = error.response?.data?.message || "Failed to process document with Maya/AI";
        this.showSnackBar = true;
      } finally {
        this.processingMaya = false;
      }
    },
    
    

    async confirmFinalSummary() {
      try {
        this.confirmingSummary = true;
        
        const payload = {
          summary: this.editableSummary,
          maskedFileId: this.maskedFileId
        };

        const response = await confirmTaxReturn(this.applicantdata.id, payload);

        if (response && response.data) {
          this.finalSummaryConfirmed = true;
          this.msg = "Summary confirmed. Masked document is now visible to the client and email sent.";
          this.showSnackBar = true;
          
          // Refresh data
          this.loadApplicationData();
        }
      } catch (error) {
        console.error("Confirm Summary Error:", error);
        this.msg = error.response?.data?.message || "Failed to confirm summary";
        this.showSnackBar = true;
      } finally {
        this.confirmingSummary = false;
      }
    },

    validateDiscount() {
      const refundAmount = parseFloat(this.refundAmount) || 0;
      const discountAmount = parseFloat(this.discountAmount) || 0;

      if (discountAmount > refundAmount) {
        this.msg = "Discount amount cannot be greater than refund amount";
        this.showSnackBar = true;
        this.discountAmount = refundAmount;
      }
    },

    onPaymentTypeChange() {
      // When switching payment types, keep refund amount but clear other fields
      if (this.paymentType === 'flatfee') {
        // Switching to flat fee mode
        this.showResults = false;
        this.calculationResponse = null;
      } else {
        // Switching to commission mode
        this.flatFeeAmount = null;
      }
    },

    onRefundAmountChange() {
      // Clear flat fee amount when refund amount is cleared
      if (!this.refundAmount) {
        this.flatFeeAmount = null;
      }
    },

    resetForm() {
      this.selectedStatus = 'pending';
      this.refundAmount = null;
      this.discountAmount = null;
      this.uploadedFile = null;
      this.uploadedFileInfo = null;
      this.showResults = false;
      this.calculationResponse = null;
      this.paymentType = 'commission';
      this.flatFeeAmount = null;
      
      // Clear file input if it exists
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },

    loadApplicationData() {
      // If refund is completed, populate the calculation response from applicant data
      if (this.isRefundCompleted && this.applicantdata) {
        // Determine payment type based on data: if flatFee exists or commission amounts are zero, it's flat fee
        const hasCommission = (parseFloat(this.applicantdata.commissionAmount) || 0) > 0 || 
                              (parseFloat(this.applicantdata.totalCommissionAmount) || 0) > 0;
        
        if (!hasCommission || this.applicantdata.flatFee) {
          // This was a flat fee submission
          this.paymentType = 'flatfee';
          this.flatFeeAmount = parseFloat(this.applicantdata.flatFee) || null;
        } else {
          // This was a commission submission
          this.paymentType = 'commission';
          this.calculationResponse = {
            refundAmount: parseFloat(this.applicantdata.refundAmount) || 0,
            commissionAmount: parseFloat(this.applicantdata.commissionAmount) || 0,
            commissionPercentage: parseFloat(this.applicantdata.commissionPercentage) || 0,
            totalCommissionAmount: parseFloat(this.applicantdata.totalCommissionAmount) || 0,
            vatAmount: parseFloat(this.applicantdata.vatAmount) || 0,
            vatPercentage: parseFloat(this.applicantdata.vatPercentage) || 0,
            discountAmount: parseFloat(this.applicantdata.discountAmount) || 0,
            finalAmount: parseFloat(this.applicantdata.finalAmount) || 0
          };
          this.showResults = true;
        }

        // Set form values from existing data
        this.selectedStatus = this.applicantdata.status;
        this.refundAmount = this.applicantdata.refundAmount;
        this.discountAmount = this.applicantdata.discountAmount;

        // Load automated summary if already exists
        if (this.applicantdata.automatedSummary) {
          this.automatedSummary = this.applicantdata.automatedSummary;
        }
        
        // Load finalized summary if already exists
        if (this.applicantdata.taxReturnSummary) {
          this.editableSummary = this.applicantdata.taxReturnSummary;
          this.finalSummaryConfirmed = true;
        } else if (this.automatedSummary) {
          this.editableSummary = this.automatedSummary;
        }
      }
    },
  },
};
</script>

<style scoped>
/* Update Status Component - Pixel Perfect Figma Match */
.update-status-container {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  margin: 0 auto;
  background: #ffffff;
}

/* Page Title */
.page-title {
  font-family: "Inter", sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 40px;
  margin: 0;
}

/* Top Controls Section */
.top-controls-section {
  background: #ffffff;
  padding: 0;
  margin-bottom: 32px;
}

.form-group {
  width: 100%;
}

.form-label {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  line-height: 20px;
  display: block;
  margin-bottom: 6px;
}

/* Status Select Dropdown */
.status-select {
  width: 100%;
}

.status-select .v-input__control {
  min-height: 44px !important;
}

.status-select .v-input__slot {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  padding: 0 12px !important;
  min-height: 44px !important;
}

.status-select .v-input__slot:hover {
  border-color: #9ca3af !important;
}

.status-select.v-input--is-focused .v-input__slot {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.select-text {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #111827;
  line-height: 24px;
}

/* Refund Input Field */
.refund-input {
  width: 100%;
}

.refund-input .v-input__control {
  min-height: 44px !important;
}

.refund-input .v-input__slot {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  padding: 0 12px !important;
  min-height: 44px !important;
}

.refund-input .v-input__slot:hover {
  border-color: #9ca3af !important;
}

.refund-input.v-input--is-focused .v-input__slot {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.refund-input input {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #111827;
  line-height: 24px;
}

.refund-input input::placeholder {
  color: #9ca3af;
}

/* Discount Input Field */
.discount-input {
  width: 100%;
}

.discount-input .v-input__control {
  min-height: 44px !important;
}

.discount-input .v-input__slot {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  padding: 0 12px !important;
  min-height: 44px !important;
}

.discount-input .v-input__slot:hover {
  border-color: #9ca3af !important;
}

.discount-input.v-input--is-focused .v-input__slot {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.discount-input input {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #111827;
  line-height: 24px;
}

.discount-input input::placeholder {
  color: #9ca3af;
}

/* Discount Input Field in Card */
.discount-input-card {
  width: 100%;
}

.discount-input-card .v-input__control {
  min-height: 36px !important;
}

.discount-input-card .v-input__slot {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  border-radius: 6px !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  padding: 0 8px !important;
  min-height: 36px !important;
}

.discount-input-card .v-input__slot:hover {
  border-color: #9ca3af !important;
}

.discount-input-card.v-input--is-focused .v-input__slot {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

.discount-input-card input {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #111827;
  line-height: 20px;
}

.discount-input-card input::placeholder {
  color: #9ca3af;
}

/* Calculate Button */
.calculate-button {
  height: 40px !important;
  border-radius: 4px !important;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-transform: none !important;
  letter-spacing: normal !important;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
  width: 100%;
  min-width: 120px;
}

.calculate-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

.calculate-button.v-btn--disabled {
  background: #f9fafb !important;
  color: #d1d5db !important;
  box-shadow: none !important;
}

/* Amount Details Card */
.amount-details-card {
  background: #f8fafc !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
}

.card-header {
  background: #f8fafc;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  line-height: 28px;
  margin: 0;
}

.card-content {
  padding: 20px 24px;
  background: #ffffff;
}

.detail-item {
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-label {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #374151;
  line-height: 24px;
}

.detail-value {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
  line-height: 24px;
}

.detail-amt {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  margin-left: 2px;
  line-height: 24px;
}

/* Special Discount Item */
.discount-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px !important;
  margin: 8px -24px 0 -24px;
  border-bottom: 1px solid #e5e7eb !important;
}

/* Final Amount Section */
.final-amount-section {
  background: #ffffff;
  padding: 24px 0;
  border-top: 2px solid #e5e7eb;
  border-bottom: 2px solid #e5e7eb;
  margin: 32px 0;
}

.final-amount-label {
  font-family: "Inter", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  line-height: 32px;
  margin: 0;
}

.final-amount-value {
  font-family: "Inter", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
  line-height: 32px;
}

/* Upload Tax Return Section - Pixel Perfect Figma Match */
.upload-tax-return-section {
  background: #ffffff;
  margin-top: 32px;
}

.upload-title {
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  line-height: 28px;
  margin: 0 0 4px 0;
}

.upload-subtitle {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  line-height: 20px;
  margin: 0 0 16px 0;
}

/* Upload Button - Exact Figma Design */
.upload-button-figma {
  background: #e6f3ff !important;
  border: 1px solid #e6f3ff !important;
  border-radius: 8px !important;
  height: 40px !important;
  min-width: 150px !important;
  padding: 8px 16px !important;
  text-transform: none !important;
  font-family: "Inter", sans-serif !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  transition: all 0.2s ease !important;
}

.upload-button-figma:hover {
  background: #d1e9ff !important;
  border-color: #d1e9ff !important;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1) !important;
}

.upload-button-figma .v-btn__content {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.upload-button-text {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #2b7de9;
  line-height: 20px;
}

/* Uploaded File Display - Figma Design */
.uploaded-file-figma {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  min-height: 44px;
  display: flex;
  align-items: center;
}

.file-name-figma {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #374151;
  line-height: 20px;
}

/* Delete File Button */
.delete-file-btn {
  width: 32px !important;
  height: 32px !important;
  background: transparent !important;
  transition: all 0.2s ease !important;
}

.delete-file-btn:hover {
  background: #fef2f2 !important;
  border-radius: 50% !important;
}

.delete-file-btn .v-icon {
  transition: color 0.2s ease;
}

.delete-file-btn:hover .v-icon {
  color: #dc2626 !important;
}

/* Submit Button */
.submit-button {
  height: 48px !important;
  border-radius: 8px !important;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-transform: none !important;
  letter-spacing: normal !important;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  min-width: 140px;
}

.submit-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
}

.submit-button.v-btn--disabled {
  background: #f9fafb !important;
  color: #d1d5db !important;
  box-shadow: none !important;
}

/* Submit Confirmation Dialog Styles */
.submit-confirmation-container {
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.submit-confirmation-content-wrapper {
  padding: 24px;
}

.submit-confirmation-title {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #000000;
  text-align: center;
  margin-top: 12px;
  margin-bottom: 12px;
}

.submit-confirmation-subtitle {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5F5F5F;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 24px;
}

.submit-confirmation-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.submit-cancel-btn {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #5F5F5F !important;
  background: #F5F5F5 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border-radius: 6px !important;
  padding: 0 24px !important;
  height: 40px !important;
  min-width: 100px !important;
}

.submit-cancel-btn:hover {
  background: #E0E0E0 !important;
}

.submit-confirm-btn {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #FFFFFF !important;
  background: #1A73E9 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border-radius: 6px !important;
  padding: 0 24px !important;
  height: 40px !important;
  min-width: 100px !important;
}

.submit-confirm-btn:hover {
  background: #1557B0 !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .top-controls-section .v-flex {
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 24px;
    line-height: 32px;
  }

  .card-header,
  .card-content {
    padding: 16px 20px;
  }

  .discount-item {
    margin: 8px -20px 0 -20px;
  }
}

/* Fix alignment at 1024px width */
@media (min-width: 1024px) and (max-width: 1024px) {
  .calculate-button {
    margin-top: 26px !important;
  }
}

/* Payment Type Radio Buttons */
.payment-type-radio {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.payment-type-radio .v-input__control {
  min-height: 40px !important;
}

.payment-type-radio .v-radio {
  margin-right: 16px !important;
}

.payment-type-radio .v-label {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #374151;
}

/* Animation for smooth transitions */
.detail-item,
.uploaded-file-item {
  transition: all 0.2s ease;
}

.detail-item:hover {
  background: #f9fafb;
  margin: 0 -12px;
  padding: 12px;
  border-radius: 6px;
}

/* Remove Vuetify default styling overrides */
.v-input--hide-details .v-text-field__details {
  display: none !important;
}

.v-text-field>.v-input__control>.v-input__slot:before {
  border-style: none !important;
}

.v-text-field>.v-input__control>.v-input__slot:after {
  border-style: none !important;
}

.v-select.v-text-field input {
  cursor: pointer;
}
</style>
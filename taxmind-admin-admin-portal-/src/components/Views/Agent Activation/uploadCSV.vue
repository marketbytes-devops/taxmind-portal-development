<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: #ffffff">{{ msg }}</span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon style="color: #ffffff">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <v-layout wrap justify-center pb-16>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">

          <v-flex xs12 sm6 text-start align-self-center pt-2 class="page-title">
            <v-icon size="40" @click="goBack">mdi-chevron-left</v-icon> Upload CSV to Import
          </v-flex>
        </v-layout>

        <!-- Main Content Layout -->
        <v-layout column>
          <!-- Drag and Drop Upload Area -->
          <v-flex class="white mb-4" v-if="!csvData.length">
            <div class="upload-area" @drop="handleFileDrop" @dragover.prevent @dragenter.prevent
              @click="$refs.fileInput.click()">
              <div class="upload-content">
                <v-img :src="require('@/assets/iconsets/uploadcsv.svg')" width="56" height="56"
                  class="upload-icon mb-4"></v-img>
                <div class="upload-text">
                  <span class="text-gray">Drop your File or </span>
                  <span class="text-underline">browse</span>
                </div>
              </div>
              <input ref="fileInput" type="file" accept=".csv" style="display: none" @change="handleFileSelect" />
            </div>
          </v-flex>

          <!-- CSV Data Table -->
          <v-flex class="white mb-2" v-if="csvData.length">
            <v-data-table :headers="csvHeaders" :items="csvData" :items-per-page="-1" :hide-default-footer="true"
              class="csv-upload-table" :mobile-breakpoint="0">
              <!-- Item Template -->
              <template v-slot:item="{ item }">
                <tr class="table-row">
                  <td v-for="(header, index) in csvHeaders" :key="index">
                    <span class="cell-text">{{ item[header.value] }}</span>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-flex>

          <!-- Action Buttons -->
          <v-flex class="text-right mt-4" v-if="csvData.length">
            <v-btn class="clear-btn mr-3" :ripple="false" depressed outlined @click="clearAll">
              Clear all
            </v-btn>
            <v-btn color="primary" :ripple="false" depressed dark @click="importCSV">
              Import
            </v-btn>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import http from "@/api/http";

export default {
  name: "UploadCSV",
  data() {
    return {
      // Loading states
      appLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      ServerError: false,

      // CSV data
      csvData: [],
      csvHeaders: [],
      selectedFile: null,
    };
  },
  methods: {
    // Handle file drop
    handleFileDrop(event) {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    },

    // Handle file selection from input
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.processFile(file);
      }
    },
    goBack() {
      this.$router.push("/agent-activation");
    },

    // Process the uploaded CSV file
    processFile(file) {
      if (!file || file.type !== "text/csv") {
        this.msg = "Please select a valid CSV file";
        this.showSnackBar = true;
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          this.parseCSV(csv);
        } catch (error) {
          this.msg = "Error reading file: " + error.message;
          this.showSnackBar = true;
        }
      };

      reader.readAsText(file);
    },

    // Parse CSV content
    parseCSV(csv) {
      const lines = csv.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        this.msg = "CSV file must contain headers and at least one data row";
        this.showSnackBar = true;
        return;
      }

      // Parse headers
      const headers = lines[0]
        .split(",")
        .map((header) => header.trim().replace(/"/g, ""));

      // Validate headers against expected format
      const validationResult = this.validateHeaders(headers);
      if (!validationResult.isValid) {
        this.msg = validationResult.error;
        this.showSnackBar = true;
        return;
      }

      this.csvHeaders = headers.map((header) => ({
        text: header,
        value: this.mapHeaderToFieldName(header),
        sortable: false,
        align: "left",
      }));

      // Parse data rows
      this.csvData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(",")
          .map((value) => value.trim().replace(/"/g, ""));
        const row = {};

        headers.forEach((header, index) => {
          const fieldName = this.mapHeaderToFieldName(header);
          row[fieldName] = values[index] || "";
        });

        this.csvData.push(row);
      }

      this.msg = `Successfully loaded ${this.csvData.length} records from CSV`;
      this.showSnackBar = true;
    }
    ,

    // Map display header to camelCase field name
    mapHeaderToFieldName(displayHeader) {
      const headerMap = {
        "Notice No.": "noticeNo",
        "Customer Name": "customerName",
        "Regn./Trader No./Doc ID": "regnTraderNo",
        "Mandatory EFiler": "mandatoryEFiler",
        "Tax Type/Duty/Rep. Oblig.": "taxTypeDutyRep",
        "Document Type": "documentType",
        "Period Begin": "periodBegin",
        "Issued Date": "issuedDate",
        "Archived By": "archivedBy"
      };
      return headerMap[displayHeader] || displayHeader;
    },

    validateHeaders(headers) {
      const requiredHeader = "Regn./Trader No./Doc ID";
      
      if (!headers.includes(requiredHeader)) {
        return {
          isValid: false,
          error: `Invalid CSV format. Missing required header: ${requiredHeader}`
        };
      }

      return { isValid: true };
    },


    // Clear all data
    clearAll() {
      this.csvData = [];
      this.csvHeaders = [];
      this.selectedFile = null;
      this.$refs.fileInput.value = "";
      this.msg = "All data cleared";
      this.showSnackBar = true;
    },

    // Import CSV data to API
    async importCSV() {
      if (!this.selectedFile || !this.csvData.length) {
        this.msg = "No data to import";
        this.showSnackBar = true;
        return;
      }

      try {
        this.appLoading = true;

        // Create FormData for file upload
        // const formData = new FormData();
        // formData.append("csvFile", this.selectedFile);
        // formData.append("data", JSON.stringify(this.csvData));

        const response = await http.post(
          "users/agent-activations/upload",
          JSON.stringify(this.csvData),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        this.appLoading = false;

        if (response.data.status) {
          this.msg = "CSV imported successfully";
          this.showSnackBar = true;

          // Clear data after successful import
          setTimeout(() => {
            this.$router.push("/agent-activation");
            this.clearAll();

          }, 2000);
        } else {
          this.msg = response.data.message || "Import failed";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        this.handleApiError(err);
      }
    },

    // Handle API errors
    handleApiError(err) {
      if (err.response) {
        if (err.response.status === 500) {
          this.ServerError = true;
          this.msg = "A server error occurred. Please try again later.";
        } else {
          this.ServerError = false;
          this.msg = err.response.data.message || "An error occurred.";
        }
      } else {
        this.ServerError = true;
        this.msg = "An unexpected error occurred. Please try again.";
      }
      this.showSnackBar = true;
    },
  },
};
</script>

<style scoped>
/* === Upload CSV Styles === */

/* ----- Page Title ----- */
.page-title {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 31px;
  color: #000000;
}

/* ----- Upload Area ----- */
.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
  background: #ffffff;
}

.upload-area:hover {
  border-color: #1a73e9;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  margin-bottom: 16px;
}

.upload-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  line-height: 18px;
}

.text-gray {
  color: #5f5f5f;
  font-weight: 400;
}

.text-underline {
  color: #000000;
  font-weight: 400;
  text-decoration: underline;
  text-decoration-color: #000000;
}

/* ----- CSV Table Styles ----- */
.csv-upload-table {
  background: #ffffff;
}

.csv-upload-table .v-data-table__wrapper {
  overflow-x: auto;
}

/* Table Headers */
::v-deep(.csv-upload-table .v-data-table-header th),
::v-deep(.csv-upload-table .v-data-table-header th .v-data-table-header__content) {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 12px;
  min-height: 60px;
  vertical-align: top;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  color: #000000;
  text-transform: none;
  white-space: pre-line;
  cursor: default;
}

::v-deep(.csv-upload-table .v-data-table-header th .v-data-table-header__icon) {
  display: none;
}

/* Table Rows */
.csv-upload-table tbody tr {
  background: #ffffff;
  transition: background-color 0.2s ease;
}

.csv-upload-table tbody tr:hover {
  background: #f8f9fa;
}

/* Table Cells */
.csv-upload-table tbody td {
  padding: 16px 12px;
  border-bottom: 1px solid #e0e0e0;
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #1a73e9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.csv-upload-table tbody tr:last-child td {
  border-bottom: none;
}

/* ----- Action Buttons ----- */
.clear-btn {
  border: 1px solid #5f5f5f80;
  color: #5f5f5f;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
}

/* ----- Hide Footer ----- */
.csv-upload-table .v-data-footer {
  display: none;
}

/* ----- Responsive ----- */
@media (max-width: 1024px) {
  .v-flex.pt-5 {
    padding: 16px;
  }

  .upload-area {
    padding: 40px 15px;
  }
}

@media (max-width: 768px) {
  .csv-upload-table {
    min-width: 800px;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>
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
        <v-layout wrap justify-start align-center class="my-3">
          <v-flex shrink>
            <v-btn icon @click="goBackToUserList" class="mr-2">
              <v-icon color="#1A73E9">mdi-chevron-left</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs12 sm6 md6 lg6 text-start align-center pt-2 class="carousalhead">User Details
          </v-flex>
          <v-flex xs12 sm6 md4 lg4 text-right pt-2>
            <v-btn
              v-if="!userData.parentId && !userData.spouse"
              color="#1A73E9"
              dark
              @click="openPairDialog"
            >
              Pair Spouse
            </v-btn>
            <v-btn
              v-else
              color="error"
              outlined
              @click="openUnpairDialog"
            >
              Unpair Spouse
            </v-btn>
            <v-chip v-if="userData.isJointAssessment" :color="userData.parentId ? 'info' : 'success'" dark class="ml-2">
              {{ userData.parentId ? 'Spouse Account' : 'Primary Account (Joint)' }}
            </v-chip>
          </v-flex>
        </v-layout>

        <!-- Pair User Dialog -->
        <v-dialog v-model="pairUserDialog" max-width="600px">
          <v-card class="rounded-lg">
            <v-card-title class="headline">Pair with Spouse</v-card-title>
            <v-card-text>
              <p>Select a user to pair as a spouse for joint assessment.</p>
              <v-autocomplete
                v-model="selectedSpouseId"
                :items="potentialSpouses"
                item-text="nameEmail"
                item-value="id"
                label="Search User by Name or Email"
                placeholder="Start typing..."
                outlined
                clearable
                :loading="searchingUsers"
                @update:search-input="searchPotentialSpouses"
              >
                <template v-slot:item="data">
                  <v-list-item-content>
                    <v-list-item-title>{{ data.item.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ data.item.email }} ({{ data.item.ppsNumber }})</v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-autocomplete>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="pairUserDialog = false">Cancel</v-btn>
              <v-btn color="#1A73E9" dark :loading="pairingInProgress" @click="confirmPairing">
                Confirm Pairing
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Unpair User Dialog -->
        <v-dialog v-model="unpairUserDialog" max-width="450px">
          <v-card class="rounded-lg">
            <v-card-title class="headline error--text">Unpair Spouse?</v-card-title>
            <v-card-text class="pt-2">
              <p>Are you sure you want to break this joint assessment pairing? Both accounts will become independent primary accounts.</p>
              <div v-if="userData.spouse" class="pa-3 grey lighten-4 rounded">
                <strong>Current Pairing:</strong><br>
                {{ userData.fullName }} & {{ userData.spouse.name }}
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="unpairUserDialog = false">Cancel</v-btn>
              <v-btn color="error" :loading="unpairingInProgress" @click="confirmUnpairing">
                Confirm Unpair
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12 sm12 md12 lg12>
                <v-card class="pa-8 pt-10" outlined color="white">
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Name</span>
                      <br />
                      <span v-if="userData.fullName">{{
                        userData.fullName
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Email</span>
                      <br />
                      <span v-if="userData.email">{{ userData.email }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Phone Number</span>
                      <br />
                      <span v-if="userData.phone">{{ userData.phone }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Date Of Birth</span>
                      <br />
                      <span v-if="userData.dob">{{
                        formattedDateOfBirth
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Profession</span>
                      <br />
                      <span v-if="userData.profession">{{
                        userData.profession
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">PPS Number</span>
                      <br />
                      <span v-if="userData.ppsNumber">{{
                        userData.ppsNumber
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Eircode</span>
                      <br />
                      <span v-if="userData.eircode">{{
                        userData.eircode
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Address</span>
                      <br />
                      <span v-if="userData.address">{{
                        userData.address
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Marital Status</span>
                      <br />
                      <span v-if="userData.maritalStatus">{{
                        formatMaritalStatus(userData.maritalStatus)
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4 v-if="

                    userData.spouse
                  ">
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Spouse Details</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Full Name</span>
                          <br />
                          <span v-if="spouseData.name">{{
                            spouseData.name
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Email</span>
                          <br />
                          <span v-if="spouseData.email">{{
                            spouseData.email
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Phone Number</span>
                          <br />
                          <span v-if="spouseData.phone">{{
                            spouseData.phone
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Date Of Birth</span>
                          <br />
                          <span v-if="spouseData.dob">{{
                            formattedSpouseDateOfBirth
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Profession</span>
                          <br />
                          <span v-if="spouseData.profession">{{
                            spouseData.profession
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">PPS Number</span>
                          <br />
                          <span v-if="spouseData.ppsNumber">{{
                            spouseData.ppsNumber
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Eircode</span>
                          <br />
                          <span v-if="spouseData.eircode">{{
                            spouseData.eircode
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Address</span>
                          <br />
                          <span v-if="spouseData.address">{{
                            spouseData.address
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start class="my-3" v-if="userApplicationData && userApplicationData.length > 0">
          <v-flex xs12 sm6 md8 lg8 text-start align-center pt-2 class="carousalhead">Applications
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start class="my-3">
          <v-flex xs12 v-if="userApplicationData && userApplicationData.length > 0">
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <div class="table-container">
                  <v-data-table :headers="headers" :items="processedApplicationData" hide-default-footer
                    :items-per-page="limit" class="elevation-0 custom-data-table" style="cursor: pointer" @click:row="viewUserDetails">
                  </v-data-table>
                </div>
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
          <v-flex v-else>
            <v-card class="pa-4" outlined>
              <v-layout align-center justify-center>
                <v-flex text-center>
                  <v-icon size="48" color="grey lighten-1" class="mb-2">mdi-file-document-outline</v-icon>
                  <div class="subtitle-1 grey--text">
                    No applications found for this user
                  </div>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start class="my-3" v-if="
          userData &&
          userData.statusHistory &&
          userData.statusHistory.length > 0
        ">
          <v-flex xs12 sm6 md8 lg8 text-start align-center pt-2 class="carousalhead">Timeline
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start pb-10 v-if="
          userData &&
          userData.statusHistory &&
          userData.statusHistory.length > 0
        ">
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12 sm12 md12 lg12>
                <v-card class="pa-8 pt-10" outlined color="white">
                  <v-layout wrap justify-start px-4 pt-4>
                    <v-flex xs12>
                      <v-timeline dense>
                        <v-timeline-item small v-for="(item, index) in userData.statusHistory" :key="index">
                          <div style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">
                            {{ item.status }}
                            <span v-if="item.isAuto">(After Re-applying)</span>
                          </div>
                          <div>{{ formatDate(item.updatedAt) }}</div>
                        </v-timeline-item>
                      </v-timeline>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import {
  getUser,
  getUserApplications,
  listUsers,
  pairUser,
  unpairUser,
} from "@/api/modules/users";
export default {
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      keyword: "",
      usersList: [],
      showSnackBar: false,
      timeout: 5000,
      userData: {},
      spouseData: {},
      msg: "",
      fromPage: 1,
      headers: [
        { text: "Sl.No", value: "slno", align: "start" },
        { text: "Client Name", value: "clientName", align: "start" },
        { text: "Application No", value: "applicationNo", align: "start" },
        { text: "Year", value: "year", align: "start" },
        { text: "Status", value: "status", align: "start" },
        { text: "Created At", value: "createdAt", align: "start" },
        // { text: "Actions", value: "id", align: "start", width: "50px" },
      ],
      appLoading: false,
      itemToDelete: null,
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 5,
      userApplicationData: [],
      allUserApplicationData: [],
      pairUserDialog: false,
      unpairUserDialog: false,
      selectedSpouseId: null,
      potentialSpouses: [],
      searchingUsers: false,
      pairingInProgress: false,
      unpairingInProgress: false,
    };
  },
  mounted() {
    // Store the page number from which user navigated here
    this.fromPage = parseInt(this.$route.query.fromPage) || 1;
    this.getData(); // We will call getUserApplicationData() after userData is resolved
  },
  watch: {
    currentPage() {
      // Do client side slicing instead of network fetch
      this.sliceApplicationData();
    },
  },
  computed: {
    formattedDateOfBirth() {
      if (!this.userData?.dob) return "_____________";

      let date;
      const dob = this.userData.dob;

      // Handle "DD/MM/YYYY" and "YYYY-MM-DD"
      if (dob.includes("/")) {
        const [day, month, year] = dob.split("/");
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dob);
      }

      if (isNaN(date)) return "Invalid Date";

      const options = { day: "2-digit", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-GB", options);
    },
    formattedSpouseDateOfBirth() {
      if (!this.spouseData?.dob) return "_____________";

      let date;
      const dob = this.spouseData.dob;

      // Handle "DD/MM/YYYY" and "YYYY-MM-DD"
      if (dob.includes("/")) {
        const [day, month, year] = dob.split("/");
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dob);
      }

      if (isNaN(date)) return "Invalid Date";

      const options = { day: "2-digit", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-GB", options);
    },
    processedApplicationData() {
      return this.userApplicationData.map((app, index) => ({
        ...app,
        slno: (this.currentPage - 1) * this.limit + index + 1,
        createdAt: this.formatDate(app.createdAt),
        applicationNo:
          app.applicationNo || `APP-${app.id?.slice(0, 8) || "N/A"}`,
        clientName: app.user?.name || this.userData.fullName || "-",
      }));
    },
  },
  methods: {
    getData() {
      this.appLoading = true;
      getUser(this.$route.query.id)
        .then((response) => {
          this.appLoading = false;
          const apiData = response.data.data;
          this.userData = {
            id: apiData.id,
            fullName: apiData.name,
            email: apiData.email,
            phone: apiData.phone,
            dob: apiData.dob,
            profession: apiData.profession,
            ppsNumber: apiData.ppsNumber,
            eircode: apiData.eircode,
            address: apiData.address,
            maritalStatus: apiData.maritalStatus,
            spouse: apiData.spouse || null,
            parentId: apiData.parentId,
            isJointAssessment: apiData.isJointAssessment,
            statusHistory: apiData.statusHistory || [],
          };
          this.spouseData = this.userData.spouse || {};
          
          this.getUserApplicationData();
        })
        .catch((err) => {
          this.appLoading = false;
          this.handleApiError(err);
        });
    },
    viewUserDetails(item) {
      // Redirect to another page with the application ID as a parameter
      this.$router.push({ name: "application-view", query: { id: item.id } });
    },
    getUserApplicationData() {
      this.appLoading = true;
      const userId = this.$route.query.id;
      
      const promises = [
        getUserApplications(userId, { page: 1, size: 100 })
      ];

      // If it's a joint assessment, also fetch spouse's applications
      if (this.userData && this.userData.isJointAssessment) {
        const spouseId = this.userData.parentId ? this.userData.parentId : (this.userData.spouse ? this.userData.spouse.id : null);
        if (spouseId) {
          promises.push(getUserApplications(spouseId, { page: 1, size: 100 }));
        }
      }

      Promise.all(promises)
        .then((responses) => {
          this.appLoading = false;
          let allData = [];
          
          responses.forEach((res) => {
            if (res && res.data && res.data.success) {
              allData = [...allData, ...res.data.data];
            }
          });

          // Sort by creation date descending
          allData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          this.allUserApplicationData = allData;
          this.pages = Math.ceil(this.allUserApplicationData.length / this.limit) || 1;
          this.currentPage = 1;
          this.sliceApplicationData();
        })
        .catch((err) => {
          this.appLoading = false;
          console.log(err);
        });
    },
    sliceApplicationData() {
      const start = (this.currentPage - 1) * this.limit;
      const end = start + this.limit;
      this.userApplicationData = this.allUserApplicationData.slice(start, end);
    },
    handleApiError(err) {
      if (err.response) {
        this.msg = err.response.data.message || "An error occurred.";
      } else {
        this.msg = "An unexpected error occurred.";
      }
      this.showSnackBar = true;
    },
    openPairDialog() {
      this.pairUserDialog = true;
      this.selectedSpouseId = null;
      this.potentialSpouses = [];
    },
    async searchPotentialSpouses(val) {
      if (!val || val.length < 3) return;
      this.searchingUsers = true;
      try {
        const response = await listUsers({ keyword: val, limit: 10 });
        if (response.data.success) {
          this.potentialSpouses = response.data.data
            .filter(u => u.id !== this.userData.id && !u.parentId)
            .map(u => ({
              ...u,
              nameEmail: `${u.name} (${u.email})`
            }));
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        this.searchingUsers = false;
      }
    },
    async confirmPairing() {
      if (!this.selectedSpouseId) return;
      this.pairingInProgress = true;
      try {
        const response = await pairUser(this.userData.id, this.selectedSpouseId);
        if (response.data.success) {
          this.msg = "Users paired successfully!";
          this.showSnackBar = true;
          this.pairUserDialog = false;
          this.getData(); // Refresh user data
        }
      } catch (error) {
        this.handleApiError(error);
      } finally {
        this.pairingInProgress = false;
      }
    },
    openUnpairDialog() {
      this.unpairUserDialog = true;
    },
    async confirmUnpairing() {
      this.unpairingInProgress = true;
      try {
        const response = await unpairUser(this.userData.id);
        if (response.data.success) {
          this.msg = "Users unpaired successfully!";
          this.showSnackBar = true;
          this.unpairUserDialog = false;
          this.getData(); // Refresh user data
        }
      } catch (error) {
        this.handleApiError(error);
      } finally {
        this.unpairingInProgress = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    },

       formatMaritalStatus(status) {
      if (!status) return "_____________";
      const statusMap = {
        single: "Single",
        married: "Married",
        divorced: "Divorced",
        widowed: "Widowed",
        separated: "Separated",
        civil_partnership: "Civil Partnership",
        married_spouse_abroad: "Married spouse abroad",
      };
      return statusMap[status.toLowerCase()] || status;
    },
    goBackToUserList() {
      // Navigate back to user list with the page number preserved
      this.$router.push({
        name: "users-list",
        query: { page: this.fromPage },
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

.carousalhead {
  color: #1a73e9;
  font-family: opensansbold;
  font-size: 20px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  margin-top: 15px;
  margin-bottom: 20px;
}

/* Force nowrap on all data table cells */
::v-deep .custom-data-table th,
::v-deep .custom-data-table td {
  white-space: nowrap !important;
  padding: 12px 16px !important;
  font-family: 'Open Sans', sans-serif !important;
}

::v-deep .custom-data-table th {
  background-color: #f8f9fa !important;
  color: #333 !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  font-size: 12px !important;
  letter-spacing: 0.5px;
}

::v-deep .custom-data-table tr:hover {
  background-color: #f0f7ff !important;
}
</style>
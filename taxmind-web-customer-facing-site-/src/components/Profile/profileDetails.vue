<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <!-- Global snackbar mounted in App.vue - use this.$snackbar.showSuccess()/showError() -->
    <v-layout wrap justify-center pt-1>
      <v-flex xs12>
        <v-layout wrap justify-center>
          <v-flex xs12 pa-1 pa-sm-0>
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-layout wrap justify-center>
                  <v-flex xs12 sm6 lg6 text-left>
                    <span style="
                        font-family: FajallaOne;
                        font-weight: 400;
                        font-size: 30px;
                        line-height: 37.71px;
                      ">
                      Profile View
                    </span>
                  </v-flex>
                  <v-flex xs12 sm6 lg6 text-sm-end text-center pt-2 pt-sm-0>

                    <span @click="redirectToEditDetails"><v-icon color="#1157B3" medium>mdi-account-edit</v-icon><span
                        style="
                          font-family: FajallaOne;
                          font-weight: 400;
                          font-size: 18px;
                          color: #1157b3;
                          text-decoration: underline;
                          cursor: pointer;
                        ">edit</span></span>
                  </v-flex>
                </v-layout>
                <v-layout wrap justify-center pt-5>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Full Name</span><br />
                    <span class="profsubsubdata">{{ profileData.name }}</span>
                    <span class="profsubsubdata" v-if="!profileData.name">--------</span>
                  </v-flex>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Email</span><br />
                    <span class="profsubsubdata">{{ profileData.email }}</span>
                    <span class="profsubsubdata" v-if="!profileData.email">--------</span>
                  </v-flex>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Phone Number</span><br />
                    <span class="profsubsubdata">{{ profileData.phone }}</span>
                    <span class="profsubsubdata" v-if="!profileData.phone">--------</span>
                  </v-flex>
                </v-layout>
                <v-layout wrap justify-center pt-5>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Date OF Birth</span><br />
                    <span class="profsubsubdata">{{
                      formatDateOnly(profileData.dob)
                    }}</span>
                    <span class="profsubsubdata" v-if="!profileData.dob">--------</span>
                  </v-flex>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Profession</span><br />
                    <span class="profsubsubdata">{{
                      profileData.profession
                    }}</span>
                    <span class="profsubsubdata" v-if="!profileData.profession">--------</span>
                  </v-flex>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Address</span><br />
                    <span class="profsubsubdata">{{
                      profileData.address
                    }}</span>
                    <span class="profsubsubdata" v-if="!profileData.address">--------</span>
                  </v-flex>
                </v-layout>
                <v-layout wrap justify-center pt-5>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">PPS Number</span><br />
                    <span class="profsubsubdata">{{
                      profileData.ppsNumber
                    }}</span>
                    <span class="profsubsubdata" v-if="!profileData.ppsNumber">--------</span>
                  </v-flex>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Eircode</span><br />
                    <span class="profsubsubdata">{{
                      profileData.eircode
                    }}</span>
                    <span class="profsubsubdata" v-if="!profileData.eircode">--------</span>
                  </v-flex>
                  <v-flex xs12 lg4 md4 sm4 text-left>
                    <span class="profsubdata">Marital Status</span><br />
                    <span class="profsubsubdata">{{
                      formatMartialStatus(profileData.maritalStatus)
                    }}
                    
                  </span>
                    <span class="profsubsubdata" v-if="!profileData.maritalStatus">--------</span>
                  </v-flex>
                </v-layout>
                <!-- Spouse Details -->
                <v-layout wrap justify-center pt-5 v-if="spouseData">
                  <v-flex xs12 text-left>
                    <span style="
                        font-family: FajallaOne;
                        font-weight: 400;
                        font-size: 23px;
                        line-height: 37.71px;
                      ">
                      Spouse Details
                    </span>
                  </v-flex>
                  <v-flex xs12>
                    <v-layout wrap justify-center pt-5>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">Full Name</span><br />
                        <span class="profsubsubdata">{{
                          spouseData.name
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.name">--------</span>
                      </v-flex>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">Email</span><br />
                        <span class="profsubsubdata">{{
                          spouseData.email
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.email">--------</span>
                      </v-flex>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">Phone Number</span><br />
                        <span class="profsubsubdata">{{
                          spouseData.phone
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.phone">--------</span>
                      </v-flex>
                    </v-layout>
                    <v-layout wrap justify-center pt-5>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">Date OF Birth</span><br />
                        <span class="profsubsubdata">{{
                          formatDateOnly(spouseData.dob)
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.dob">--------</span>
                      </v-flex>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">Profession</span><br />
                        <span class="profsubsubdata">{{
                          spouseData.profession
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.profession">--------</span>
                      </v-flex>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">Address</span><br />
                        <span class="profsubsubdata">{{
                          spouseData.address
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.address">--------</span>
                      </v-flex>
                    </v-layout>
                    <v-layout wrap justify-center pt-5>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">PPS Number</span><br />
                        <span class="profsubsubdata">{{
                          spouseData.ppsNumber
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.ppsNumber">--------</span>
                      </v-flex>
                      <v-flex xs12 lg4 md4 sm4 text-left>
                        <span class="profsubdata">Eircode</span><br />
                        <span class="profsubsubdata">{{
                          spouseData.eircode
                        }}</span>
                        <span class="profsubsubdata" v-if="!spouseData.eircode">--------</span>
                      </v-flex>
                      <v-flex xs12 lg4 md4 sm4 text-left> </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>

    <v-layout justify-end>
      <v-btn text color="error" @click="openDeleteDialog" class="delete-account-btn mt-5 mr-2 ml-4">
        <v-icon left>mdi-delete-outline</v-icon>
        <span style="font-family: DMSans; font-weight: 500; font-size: 16px;">Delete Account</span>
      </v-btn>
    </v-layout>
    <!-- Delete Account Dialog Component -->
    <DeleteAccountDialog v-model="deleteDialog" :userEmail="profileData.email" />
  </div>

</template>


<script>
import { ApiMigrationMixin } from "@/utils/apiMigration";
import DeleteAccountDialog from "../Common/DeleteAccountDialog.vue";

export default {
  mixins: [ApiMigrationMixin],
  components: {
    DeleteAccountDialog,
  },
  data() {
    return {
      openIndex: null,
      ServerError: false,
      profileData: {},
      spouseData: {},
      // Local snackbar removed; use this.$snackbar
      appLoading: false,
      deleteDialog: false,
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    formatDateOnly(item) {
      var dt = new Date(item);
      var day = dt.getDate();
      var year = dt.getFullYear();
      dt = dt.toString();
      var strTime = day + " " + dt.slice(4, 7) + " " + year;
      return strTime;
    },
    formatDate(item) {
      var dt = new Date(item);
      var day = dt.getDate();
      var year = dt.getFullYear();
      var hours = dt.getHours();
      var minutes = dt.getMinutes();
      dt = dt.toString();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      day = day < 10 ? "0" + day : day;
      var strTime =
        day +
        " " +
        dt.slice(4, 7) +
        " " +
        year +
        " " +
        hours +
        ":" +
        minutes +
        " " +
        ampm;
      return strTime;
    },
    redirectToEditDetails() {
      this.$router.push({ path: "/profile-edit" }); // Replace 'DetailsPage' with your desired route name
    },
    openDeleteDialog() {
      this.deleteDialog = true;
    },
    async getData() {
      try {
        // Using new standardized endpoint from TAXMIND.json
        const response = await this.fetchData("/users/profile");

        // Support both response shapes: { data: { user: {...} } } and { data: {...} }
        const u =
          response && response.data && (response.data.user || response.data)
            ? response.data.user || response.data
            : null;

        this.profileData = u || {};

        // Spouse may be provided as spouseDetails or spouse
        this.spouseData =
          this.profileData.spouseDetails || this.profileData.spouse || null;
      } catch (error) {
        // Error handling done automatically by ApiMigrationMixin
        console.error("Failed to load profile data:", error);
      }
    },

    formatMartialStatus(status) {
      if (!status) return "--------";
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
  },
};
</script>

<style scoped>
.expansion-panel {
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 15px;
  background-color: white;
}

.question {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  font-family: opensansregular;
  font-size: 15px;
}

.question h3 {
  margin: 0;
  font-size: 15px;
  color: #000;
  /* Default color for closed panels */
  transition: color 0.3s ease;
}

.question h3.open {
  color: #1a73e9;
  /* Orange color for open panels */
}

.question span {
  color: #000;
  /* Default color for closed panels */
  transition: color 0.3s ease;
}

.question span.open {
  color: #1a73e9;
  /* Orange color for open panels */
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

.profsubdata {
  color: rgba(30, 111, 235, 1);
  font-family: DMSans;
  font-weight: 700;
  font-size: 18px;
}

.profsubsubdata {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
  color: rgba(26, 26, 26, 1);
}

.delete-account-btn {
  font-family: DMSans;
  text-transform: none;
  border: 1px solid red;
}

.delete-account-btn:hover {
  background-color: rgba(211, 47, 47, 0.08);
}
</style>
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
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11 pb-5>
        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">
          <v-flex xs12 sm9 md9 lg10 text-start align-center pt-2 class="carousalhead">Privacy Policy</v-flex>
          <v-flex xs12 sm3 md3 lg2 text-end align-center>
            <PermissionButton v-if="canEdit('privacy_policy')" module-name="privacy_policy" permission="edit"
              color="#1A73E9" dark class="rounded-lg carousaladdedit" @click="editdialog = true">
              <span style="text-transform: none">EDIT PRIVACY POLICY</span>
            </PermissionButton>
          </v-flex>
        </v-layout>
        <v-card class="custom-card">
          <v-card-title class="card-header">
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-layout wrap justify-end px-3 pt-2>
                  <v-flex shrink>
                    <span style="font-family: opensansregular; font-size: 16px; color: #666;">
                      Version: {{ aboutlist.version || 'N/A' }}
                    </span>
                  </v-flex>
                </v-layout>
                <v-layout wrap justify-center py-3>
                  <v-flex xs12>
                    <v-layout wrap justify-center>
                      <v-flex x12 text-center pt-3>
                        <span :style="{
                          'overflow-wrap': 'break-word',
                          'word-break': 'break-word',
                        }" style="
                            font-family: DMSans;
                            color: #1a73e9;
                            font-size: 20px;
                          ">Privacy Policy</span><br />
                      </v-flex>

                      <v-flex xs12 px-4 pt-3 text-justify>
                        <span style="
                            font-family: opensansregular;
                            text-align: justify;
                            font-size: 16px;
                          " v-html="aboutlist.content"></span>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-card-title>
          <v-divider></v-divider>
        </v-card>
      </v-flex>
    </v-layout>

    <!--edit dialog  -->
    <v-dialog v-model="editdialog" max-width="800px">
      <v-card rounded="lg">
        <v-card-title>
          <span class="editbox">EDIT PRIVACY POLICY</span>
          <v-spacer></v-spacer>
          <v-btn color="red" icon @click="editdialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-layout wrap justify-center px-2>
              <v-flex xs12 pr-2 pt-3>
                <span class="label"> Description </span>
                <vue-editor class="pt-2 text-des" style="font-size: 14px" v-model="aboutlist.content"></vue-editor>
              </v-flex>
            </v-layout>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="py-4 justify-end headline grey lighten-2">
          <v-btn outlined color="grey" text @click="editdialog = false"><span style="color: black">Cancel</span>
          </v-btn>

          <PermissionButton v-if="canEdit('privacy_policy')" module-name="privacy_policy" permission="edit"
            color="#1A73E9" dark class="rounded-lg carousaladdedit" @click="validateUpdate()">
            <span style="text-transform: none">Save Changes</span>
          </PermissionButton>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import siteContent from "@/api/modules/siteContent";
import { VueEditor } from "vue2-editor";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';

export default {
  components: {
    VueEditor,
    PermissionButton,
  },
  mixins: [permissionMixin],
  data() {
    return {
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      ServerError: false,
      description: null,
      title: "",
      appLoading: false,
      aboutlist: {},
      editdialog: false,
      editingitem: [],
      headers: [
        { text: "Name", value: "name", width: "500px" },

        { text: "Actions", value: "_id", width: "5px" },
      ],
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    async getData() {
      this.appLoading = true;
      try {
        const { success, data, message } = await siteContent.listPolicies({
          page: 1,
          size: 50,
        });
        this.appLoading = false;
        if (success) {
          const privacyPolicies = (data || []).filter(
            (policy) => policy.type === "privacy_policy"
          );
          if (privacyPolicies.length > 0) {
            privacyPolicies.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            this.aboutlist = privacyPolicies[0];
          } else {
            this.aboutlist = { content: "", type: "privacy_policy" };
          }
        } else {
          this.ServerError = false;
          this.msg = message || "Failed to fetch policies";
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

    validateUpdate() {
      if (!this.aboutlist.content) {
        this.msg = "Please Provide Description";
        this.showSnackBar = true;
        return;
      } else {
        this.editAbout();
      }
    },
    async editAbout() {
      this.appLoading = true;
      try {
        let result;
        if (this.aboutlist && this.aboutlist.id) {
          result = await siteContent.updatePolicy(this.aboutlist.id, {
            type: "privacy_policy",
            content: this.aboutlist.content,
          });
        } else {
          result = await siteContent.createPolicy({
            type: "privacy_policy",
            content: this.aboutlist.content,
          });
        }
        this.appLoading = false;
        if (result.success) {
          this.editdialog = false;
          this.msg = result.message || "Saved successfully";
          this.showSnackBar = true;
          this.getData();
        } else {
          this.msg = result.message || "Failed to save";
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
  },
};
</script>

<style scoped>
.dialog-card {
  font-family: opensansbold;
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

.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  background-color: white;
  table-layout: fixed;
  /* Fixes column widths to prevent stretching */
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
}

.table th {
  background-color: white;
  font-family: opensansbold;
  border-bottom: 1px solid #ddd;
  font-size: 16px;
}

.table td {
  font-family: opensansregular;
  font-size: 15px;
}

.table-row:hover {
  background-color: #eff2f6;
}

.actions-column {
  text-align: center;
  /* Center-aligns the action buttons */
}
</style>
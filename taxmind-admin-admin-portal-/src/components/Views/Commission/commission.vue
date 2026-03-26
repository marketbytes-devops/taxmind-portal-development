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
          <v-flex xs12 sm3 md3 lg10 text-start align-center pt-2 class="carousalhead">Commission & VAT
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-card>
                  <v-card-text>
                    <v-layout wrap justify-center>
                      <v-flex xs12 sm6 md6 lg6 pt-4>
                        <span class="label">Commission %
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="commission"
                          required outlined dense :hide-details="true"
                          :disabled="!canEdit('commission')"></v-text-field>
                      </v-flex>
                      <v-flex xs12 sm6 md6 lg6 pt-4 pl-lg-2 pl-md-2 pl-sm-2>
                        <span class="label">VAT %
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="vat" required
                          outlined dense :hide-details="true" :disabled="!canEdit('commission')"></v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-card-text>
                  <v-card-actions class="py-4 justify-end headline grey lighten-2">
                    <PermissionButton v-if="canEdit('commission')" module-name="commission" permission="edit"
                      color="#1A73E9" dark class="rounded-lg carousalbtnstyle" @click="validate()">
                      <span style="text-transform: none">Save</span>
                    </PermissionButton>
                  </v-card-actions>
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
import siteContent from "@/api/modules/siteContent";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';

export default {
  components: {
    PermissionButton,
  },
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      page: 1,
      currentPage: 1,
      commission: "",
      vat: "",
      pages: 0,
      limit: 10,
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    validate() {
      if (!this.commission) {
        this.msg = "Please Provide Commission";
        this.showSnackBar = true;
        return;
      } else if (!this.vat) {
        this.msg = "Please Provide VAT";
        this.showSnackBar = true;
        return;
      } else if (
        isNaN(this.commission) ||
        this.commission <= 0 ||
        this.commission >= 100
      ) {
        this.msg = "Commission must be a valid number between 1 and 99";
        this.showSnackBar = true;
        return;
      } else if (isNaN(this.vat) || this.vat <= 0 || this.vat >= 100) {
        this.msg = "VAT must be a valid number between 1 and 99";
        this.showSnackBar = true;
        return;
      } else {
        this.add();
      }
    },

    async add() {
      try {
        this.appLoading = true;
        const payload = {
          commissionPercentage: Number(this.commission),
          vaPercentage: Number(this.vat),
        };
        const result = await siteContent.updateSiteConfig(payload);
        this.appLoading = false;
        if (result && result.success) {
          this.msg = result.message || "Settings updated successfully";
          this.showSnackBar = true;
          await this.getData();
        } else {
          this.ServerError = false;
          this.msg = (result && result.message) || "An error occurred.";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        if (err && err.response) {
          if (err.response.status === 500) {
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            this.ServerError = false;
            this.msg = err.response.data?.message || "An error occurred.";
          }
        } else {
          this.ServerError = true;
          this.msg =
            err?.message || "An unexpected error occurred. Please try again.";
        }
        this.showSnackBar = true;
        console.log(err);
      }
    },

    async getData() {
      this.appLoading = true;
      try {
        const result = await siteContent.getSiteConfig();
        this.appLoading = false;
        if (result && result.success) {
          const data = result.data || {};
          this.commission = data.commissionPercentage ?? "";
          const vat = data.vatPercentage ?? data.vaPercentage;
          this.vat = vat ?? "";
        } else {
          this.ServerError = false;
          this.msg = (result && result.message) || "An error occurred.";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        if (err && err.response) {
          if (err.response.status === 500) {
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            this.ServerError = false;
            this.msg = err.response.data?.message || "An error occurred.";
          }
        } else {
          this.ServerError = true;
          this.msg =
            err?.message || "An unexpected error occurred. Please try again.";
        }
        this.showSnackBar = true;
        console.log(err);
      }
    },
    // Removed unrelated carousel editing/deletion methods and legacy http usage
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

.video-card {
  margin: 10px;
  cursor: pointer;
}

.video-title {
  font-size: 14px;
  font-family: interbold;
  text-transform: uppercase;
}

.video-duration {
  color: grey;
  font-size: 12px;
}

.card-header {
  background-color: #f5f5f5;
  padding: 16px;
  font-family: intermedium;
  border-bottom: 1px solid #e0e0e0;
}

.centered-text {
  text-align: center;
  padding-top: 4rem;
  padding-bottom: 4rem;
  background-color: white;
  opacity: 0.8;
  border-radius: 4px;
}
</style>
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
          <v-flex xs12 sm3 md3 lg10 text-start align-center pt-2 class="carousalhead">Edit Tax Credit
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-card>
                  <v-card-text>
                    <v-layout wrap justify-center>
                      <v-flex xs12 pt-4>
                        <span class="label">Name
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="name" required
                          outlined dense :hide-details="true"></v-text-field>
                      </v-flex>
                      <v-flex xs12 pt-4>
                        <span class="label">Short Description
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <v-textarea v-model="shortdesc" class="pt-2 text-des rounded-lg" style="font-size: 14px"
                          required outlined dense :hide-details="true"></v-textarea>
                      </v-flex>
                      <v-flex xs12 pt-4 pb-4>
                        <span class="label">Details
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <vue-editor v-model="details"></vue-editor>
                      </v-flex>
                      <v-flex xs11 sm11 md11 lg11 pa-4 align-self-center text-center style="
                          border-style: dotted;
                          border-color: #d3d3d3;
                          border-radius: 5px;
                          cursor: pointer;
                          background-color: rgba(248, 249, 249, 1);
                        " @click="triggerFileInput">
                        <v-layout wrap justify-center pt-0 style="border: 1px">
                          <v-flex xs12 sm12 md12 lg12>
                            <v-layout wrap justify-center>
                              <v-flex xs12 sm12 md12 lg12>
                                <v-icon small style="color: #074799">
                                  mdi-cloud-upload
                                </v-icon>
                                <span style="
                                    font-family: Jost-Regular;
                                    font-size: 15px;
                                  ">
                                  {{
                                    uploadedFileName ||
                                    "Select an icon to upload"
                                  }}
                                </span>
                                <input ref="fileInput" v-show="false" type="file" accept="image/jpeg,image/png"
                                  @change="uploadDoc" />
                              </v-flex>
                            </v-layout>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                    </v-layout>
                  </v-card-text>
                  <v-card-actions class="py-4 justify-end headline grey lighten-2">
                    <v-btn dark color="#1A73E9" @click="validate()" class="rounded-lg carousalbtnstyle">
                      <span style="text-transform: none">Update</span>
                    </v-btn>
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
import http from "@/api/http";
import { VueEditor } from "vue2-editor";
import siteContentAPI from "@/api/modules/siteContent";
import { files } from "@/api"
export default {
  components: {
    VueEditor,
  },
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      dialog: false,
      adddialog: false,
      id: this.$route.query.id,
      image: null,
      carouselImage: [],
      dialogdes: false,
      fullDescription: "",
      taxcreditdata: {},
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      imageArray: [],
      imageFiles: [],
      editdialog: false,
      editingitem: "",
      itemToDelete: null,
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 10,
      name: "",
      shortdesc: "",
      details: "",
      uploadedFileName: "",
      uploadedIconUrl: "",
      description: "",
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click(); // Programmatically trigger the file input
    },
    resetForm() {
      this.name = "";
      this.shortdesc = "";
      this.details = "";
      this.file = null;
      this.uploadedFileName = "";
      this.uploadedIconUrl = "";
    },
    uploadDoc(event) {
      const file = event.target.files[0]; // Get the uploaded file
      if (file) {
        this.file = file; // Store the file in the component's data
        this.uploadedFileName = file.name; // Set the file name
        // console.log("File to upload:", file);
      }
    },

    validate() {
      if (!this.name) {
        this.msg = "Please Provide Name";
        this.showSnackBar = true;
        return;
      } else if (!this.shortdesc) {
        this.msg = "Please Provide Short Description";
        this.showSnackBar = true;
        return;
      } else if (!this.details) {
        this.msg = "Please Provide Details";
        this.showSnackBar = true;
        return;
      } else {
        this.edit();
      }
    },

    async edit() {
      this.appLoading = true;

      try {
        // Create tax credit with JSON data (no multipart form)
        const created = await siteContentAPI.updateTaxCredit(this.id, {
          name: this.name,
          description: this.shortdesc,
          details: this.details,
          icon: this.uploadedIconUrl, // Use uploaded icon URL
          status: true,
        });
        const createdEntity = created?.data || created;
        const createdId = createdEntity?.id || createdEntity?._id;
        // 2. Upload image
        if (createdId && this.file) {
          await files.uploadFile(createdId, this.file, "tax_credit_icon");
        }
        if (created.success) {
          this.msg = created.message || "Tax credit created successfully";
          this.showSnackBar = true;
          this.adddialog = false;
          this.resetForm();
          await this.getData();
        } else {
          throw new Error(created.message);
        }
      } catch (error) {
        this.handleError(error.message || "Failed to create tax credit");
      } finally {
        this.appLoading = false;
      }
    },
    getData() {
      this.appLoading = true;
      http
        .get("/site-contents/tax-credits/" + this.id)
        .then((response) => {
          this.appLoading = false;
          this.taxcreditdata = response.data.data;
          this.name = this.taxcreditdata.name;
          this.shortdesc = this.taxcreditdata.description;
          this.details = this.taxcreditdata.details;
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
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
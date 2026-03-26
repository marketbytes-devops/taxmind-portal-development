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
          <v-flex xs12 sm8 md9 lg10 text-start align-center pt-2 class="carousalhead">Document Templates
          </v-flex>
          <v-flex xs12 sm4 md3 lg2 text-end align-center>
            <PermissionButton v-if="canCreate('document_templates')" module-name="document_templates"
              permission="create" color="#1A73E9" dark class="rounded-lg carousaladdedit" @click="adddialog = true">
              <span style="text-transform: none">+ Add</span>
            </PermissionButton>
          </v-flex>

          <v-dialog v-model="adddialog" max-width="700px">
            <v-card rounded="lg">
              <v-card-title>
                <span class="editbox">ADD Template</span>
                <v-spacer></v-spacer>
                <v-btn color="red" icon @click="closeDialog()">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <v-form ref="addForm">
                  <v-layout wrap justify-center px-2>
                    <v-flex xs12 pt-4 pb-4>
                      <span class="label">Name
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="name" required
                        outlined dense :hide-details="true"></v-text-field>
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
                                  "Select an document template to upload"
                                }}
                              </span>
                              <input ref="fileInput" v-show="false" type="file"
                                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                @change="uploadDoc" />
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-form>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions class="py-4 justify-end headline grey lighten-2">
                <v-btn outlined color="grey" text @click="closeDialog()"><span style="color: black">Cancel</span>
                </v-btn>
                <PermissionButton v-if="canCreate('document_templates')" module-name="document_templates"
                  permission="create" color="#1A73E9" dark class="rounded-lg carousaladdedit" @click="validate()">
                  <span style="text-transform: none">Save</span>
                </PermissionButton>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12 v-if="taxcreditlist && taxcreditlist.length > 0">
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12 py-2 v-for="(file, index) in taxcreditlist" :key="index">
                <v-card rounded="lg" flat>
                  <v-layout wrap justify-center pa-5>
                    <v-flex xs12 lg12 md10 sm6>
                      <v-layout wrap justify-center>
                        <v-flex xs12>
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                              color: #1c1c1c;
                            ">{{ file.name }}</span>
                        </v-flex>
                        <v-flex xs12>
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 18px;
                              color: #000000;
                              color: #1c1c1c;
                            ">{{ file.templateFile?.key }}</span>
                        </v-flex>
                        <v-flex xs12>
                          <span style="
                              font-family: DMSans;
                              font-weight: 400;
                              font-size: 14px;
                              color: #1c1c1c;
                            ">{{ formatDate(file.updatedAt) }}</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                    <v-flex xs12 sm6 md12 lg12 text-right align-self-center>
                      <v-layout wrap justify-center>
                        <v-flex xs12 align-self-center>
                          <v-btn plain class="bgcustom" dark download :href="file.templateFile?.filePath || file.template" target="_blank">
                            <v-icon color="#1A73E9">mdi-download</v-icon>
                          </v-btn>&nbsp;&nbsp;
                          <PermissionButton v-if="canEdit('document_templates')" module-name="document_templates"
                            permission="edit" plain class="bgcustom" dark @click="editItem(file)">
                            <v-icon color="#1A73E9">mdi-pencil</v-icon>
                          </PermissionButton>
                          <PermissionButton v-if="canDelete('document_templates')" module-name="document_templates"
                            permission="delete" plain class="bgcustom" dark @click="openDeleteDialog(file)">
                            <v-icon color="#1A73E9">mdi-delete</v-icon>
                          </PermissionButton>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
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
          <v-flex xs12 v-else>
            <v-layout wrap justify-center>
              <v-flex xs12 class="text-center">
                <span>No Templates Found !</span>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>

    <!--edit dialog  -->
    <v-dialog v-model="editdialog" max-width="700px">
      <v-card rounded="lg">
        <v-card-title>
          <span class="editbox">Edit Templates</span>
          <v-spacer></v-spacer>
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-layout wrap justify-start px-2>
              <v-flex xs12 pt-4 pb-4>
                <span class="label">
                  Name<v-icon size="10px" color="red">mdi-asterisk</v-icon>
                </span>

                <v-text-field v-model="editingitem.name" required outlined dense class="pt-2 text-des rounded-lg"
                  :hide-details="true">
                </v-text-field>
              </v-flex>
              <v-flex xs12 pa-4 align-self-center text-center style="
                  border-style: dotted;
                  border-color: #d3d3d3;
                  border-radius: 5px;
                  cursor: pointer;
                  background-color: rgba(248, 249, 249, 1);
                " @click="triggereditFileInput">
                <v-layout wrap justify-center pt-0 style="border: 1px">
                  <v-flex xs12 sm12 md12 lg12>
                    <v-layout wrap justify-center>
                      <v-flex xs12 sm12 md12 lg12>
                        <v-icon small style="color: #074799">
                          mdi-cloud-upload
                        </v-icon>
                        <span style="font-family: Jost-Regular; font-size: 15px">
                          {{
                            uploadededitFileName ||
                            "Select an document template to upload"
                          }}
                        </span>
                        <input ref="editfileInput" v-show="false" type="file"
                          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          @change="uploadeditDoc" />
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>

        <v-card-actions class="py-4 justify-end headline grey lighten-2">
          <v-btn outlined color="grey" text @click="(editdialog = false), getData()"><span
              style="color: black">Cancel</span>
          </v-btn>

          <PermissionButton v-if="canEdit('document_templates')" module-name="document_templates" permission="edit"
            color="#1A73E9" dark class="rounded-lg carousaladdedit" @click="validateUpdate()">
            <span style="text-transform: none">Save</span>
          </PermissionButton>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- delete dialog -->
    <v-dialog v-model="deletedialog" max-width="600">
      <v-card class="dialog-card">
        <v-card-title class="grey lighten-2 d-flex justify-center">
          <v-icon color="red" size="32">mdi-alert</v-icon>
          <span class="ml-2">Confirm Deletion</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">
            Are you sure you want to delete this template?
            <br />
            This action <strong>cannot be undone</strong>.
          </div>
          <v-divider class="my-3"></v-divider>
          <v-row class="pt-2" no-gutters>
            <v-col>
              <!-- <img src="@/assets/images/cat_icon.png" width="40px" height="40px" class="dialog-icon" /> -->
              <v-icon style="color: #1a73e9">mdi-chat-question</v-icon>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="d-flex justify-center pa-2">
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#cf3a45"
            @click="deletedialog = false">Cancel</v-btn>
          <v-btn style="font-family: interBold; font-size: 13px; color: white" color="#1A73E9"
            @click="confirmDelete">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import * as siteContent from "@/api/modules/siteContent";
import { files } from "@/api";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';

export default {
  components: {
    PermissionButton,
  },
  mixins: [permissionMixin],
  data() {
    return {
      openIndex: null,
      ServerError: false,
      deletedialog: false,
      dialog: false,
      adddialog: false,
      question: "",
      answer: "",
      priority: "",
      uploadedFileName: "",
      uploadededitFileName: "",
      name: "",
      shortdesc: "",
      details: "",
      taxcreditlist: [],
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      editdialog: false,
      editingitem: "",
      itemToDelete: null,
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
  },
  mounted() {
    this.getData();
  },
  methods: {
    togglePanel(index) {
      this.openIndex = this.openIndex === index ? null : index;
    },
    editItem(item) {
      this.editingitem = item;
      this.editdialog = true;
    },
    closeDialog() {
      this.adddialog = false;
      this.resetForm();
      this.getData();
    },

    resetForm() {
      this.name = "";
      this.file = null;
      this.uploadedFileName = "";
      this.description = "";
      if (this.$refs.addForm) {
        this.$refs.addForm.reset();
      }
    },
    formatDate(item) {
      const date = new Date(item);

      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' }); // "Sep"
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';

      hours = hours % 12 || 12; // convert 0 to 12

      return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
    },
    validate() {
      if (!this.name || !this.name.trim()) {
        this.msg = "Please Provide a Valid Name";
        this.showSnackBar = true;
        return;
      } else if (!this.file) {
        this.msg = "Please Provide Template";
        this.showSnackBar = true;
        return;
      } else {
        this.add();
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click(); // Programmatically trigger the file input
    },
    triggereditFileInput() {
      this.$refs.editfileInput.click(); // Programmatically trigger the file input
    },
    uploadDoc(event) {
      const file = event.target.files[0]; // Get the uploaded file
      if (file) {
        this.file = file; // Store the file in the component's data
        this.uploadedFileName = file.name; // Set the file name
        // console.log("File to upload:", file);
      }
    },
    uploadeditDoc(event) {
      const editfile = event.target.files[0]; // Get the uploaded file
      if (editfile) {
        this.editfile = editfile; // Store the file in the component's data
        this.uploadededitFileName = editfile.name; // Set the file name
        // console.log("File to upload:", editfile);
      }
    },
    async edit() {
      this.appLoading = true;
      try {
        let templateUrl = this.editingitem.template; // Keep existing template URL

        // Upload new file if provided via presigned flow
        if (this.editfile) {
          const uploaded = await files.uploadDocumentTemplate(
            this.editfile,
            this.editingitem.name || this.uploadededitFileName
          );
          templateUrl = uploaded?.url || templateUrl;
        }

        // Update document template
        const templateData = {
          name: this.editingitem.name.trim(),
          template: templateUrl,
          description: this.editingitem.description || "",
          isActive:
            this.editingitem.isActive !== undefined
              ? this.editingitem.isActive
              : true,
        };

        const templateId = this.editingitem.id || this.editingitem._id;
        const response = await siteContent.updateDocumentTemplate(
          templateId,
          templateData
        );

        this.appLoading = false;
        if (response.data && response.data.success) {
          this.msg = response.data.message;
          this.showSnackBar = true;
          this.editdialog = false;
          this.editfile = null;
          this.uploadededitFileName = null;
          this.getData();
        } else {
          this.msg =
            (response.data && response.data.message) || "Update failed";
          this.showSnackBar = true;
        }
      } catch (err) {
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
      }
    },
    async add() {
      this.appLoading = true;
      try {
        let templateUrl = "";

        // Upload file if provided using presigned flow
        if (this.file) {
          const uploaded = await files.uploadDocumentTemplate(
            this.file,
            this.name || this.uploadedFileName
          );
          templateUrl = uploaded?.url || "";
        }

        // Construct template data (but don’t call API)
        const templateData = {
          name: this.name.trim(),
          template: templateUrl,
          description: this.shortdesc || this.description || "",
          isActive: true,
        };

        // ✅ Simulate success (since no API call)
        this.appLoading = false;
        this.msg = "Template created successfully (local only).";
        this.showSnackBar = true;
        this.adddialog = false;

        // Reset form fields
        this.name = "";
        this.shortdesc = "";
        this.details = "";
        this.file = null;
        this.uploadedFileName = null;
        this.description = "";
        this.getData()
        // Optionally refresh UI (only if needed)
        // this.getData();

        console.log("Template data prepared:", templateData);

      } catch (err) {
        this.appLoading = false;
        this.ServerError = true;
        this.msg = "An unexpected error occurred. Please try again.";
        this.showSnackBar = true;
        console.error(err);
      }
    },

    validateUpdate() {
      if (!this.editingitem.name || !this.editingitem.name.trim()) {
        this.msg = "Please Provide a Valid Name";
        this.showSnackBar = true;
        return;
      } else {
        this.edit();
      }
    },
    async getData() {
      this.appLoading = true;
      console.log('---------------------')
      try {
        const response = await siteContent.getDocumentTemplates({
          page: this.currentPage,
          size: this.limit,
        });

        this.appLoading = false;
        const body = response?.data || response || {};
        const items = body.data
        this.taxcreditlist = Array.isArray(items) ? items : [];
        const total = body.metadata.total
        this.pages = total && this.limit ? Math.ceil(total / this.limit) : 0;
      } catch (err) {
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
      }
    },
    showFullDescription(desc) {
      this.fullDescription = desc;
      this.dialogdes = true;
    },
    openDeleteDialog(item) {
      this.itemToDelete = item;
      this.deletedialog = true;
    },
    confirmDelete() {
      if (this.itemToDelete) {
        this.deleteItem(this.itemToDelete);
      }
      this.deletedialog = false;
    },
    async deleteItem(r) {
      this.appLoading = true;
      try {
        const templateId = r.id || r._id;
        const response = await siteContent.deleteDocumentTemplate(templateId);

        this.delete = false;
        this.appLoading = false;
        if (response.data.success) {
          this.msg = response.data.message;
          this.showSnackBar = true;
          this.getData();
        } else {
          this.msg = response.data.message;
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        this.ServerError = true;
        console.log(err);
      }
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
  color: #ff6600;
  /* Orange color for open panels */
}

.question span {
  color: #000;
  /* Default color for closed panels */
  transition: color 0.3s ease;
}

.question span.open {
  color: #ff6600;
  /* Orange color for open panels */
}

.answer {
  font-size: 14px;
  margin-top: 10px;
  color: black;
  font-family: opensansregular;
  font-weight: 400;
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
</style>
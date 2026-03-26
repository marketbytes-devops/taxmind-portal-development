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
          <v-flex xs12 sm8 md9 lg10 text-start align-center pt-2 class="carousalhead">Tax Credits
          </v-flex>
          <v-flex xs12 sm4 md3 lg2 text-end align-center>
            <v-btn v-if="canCreate('tax_credits')" dark color="#1A73E9" @click="adddialog = true" class="rounded-lg carousaladdedit">
              <span style="text-transform: none">+ Add</span>
            </v-btn></v-flex>

          <v-dialog v-model="adddialog" max-width="700px">
            <v-card rounded="lg">
              <v-card-title>
                <span class="editbox">ADD TAX CREDIT</span>
                <v-spacer></v-spacer>
                <v-btn color="red" icon @click="closeDialog()">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <v-form ref="addForm">
                  <v-layout wrap justify-center px-2>
                    <v-flex xs12 pt-4>
                      <span class="label">Name
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="name" required
                        outlined dense :hide-details="true"></v-text-field>
                    </v-flex>

                    <v-flex xs12 pt-4>
                      <span class="label">Short Description
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-textarea v-model="shortdesc" class="pt-2 text-des rounded-lg" style="font-size: 14px" required
                        outlined dense :hide-details="true"></v-textarea>
                    </v-flex>
                    <v-flex xs12 pt-4 pb-4>
                      <span class="label">Details
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <vue-editor class="pt-2 text-des" style="font-size: 14px" v-model="details"></vue-editor>
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
                                  uploadedFileName || "Select an icon to upload"
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
                </v-form>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions class="py-4 justify-end headline grey lighten-2">
                <v-btn outlined color="grey" text @click="closeDialog()"><span style="color: black">Cancel</span>
                </v-btn>
                <v-btn v-if="canCreate('tax_credits')" dark color="#1A73E9" @click="validate()" class="rounded-lg carousaladdedit">
                  <span style="text-transform: none">Save</span>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12 v-if="taxcreditlist && taxcreditlist.length > 0">
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <div v-for="(item, index) in taxcreditlist" :key="index" class="expansion-panel">
                  <div class="question" @click="togglePanel(index)">
                    <img :src="getIconUrl(item)" alt="Tax Credit Icon"
                      style="width: 24px; height: 24px; margin-right: 10px" />
                    <h3 class="pa-3 text-capitalize" :class="{ open: openIndex === index }">
                      {{ item.name }}
                    </h3>
                    <span class="px-0" :class="{ open: openIndex === index }" style="font-size: 25px">
                      {{ openIndex === index ? "_" : "+" }}
                      <v-menu offset-y>
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn v-bind="attrs" v-on="on" icon>
                            <v-icon color="black">mdi-dots-vertical</v-icon>
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item v-if="canEdit('tax_credits')" @click="editItem(item)">
                            <v-icon small color="primary">mdi-pencil</v-icon>
                            <v-list-item-content class="pl-3 addChurch">Edit</v-list-item-content>
                          </v-list-item>
                          <v-list-item v-if="canDelete('tax_credits')" @click.stop="openDeleteDialog(item)">
                            <v-icon color="red" small>mdi-delete</v-icon>
                            <v-list-item-content class="pl-3 addChurch">Delete</v-list-item-content>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </span>
                  </div>
                  <div v-if="openIndex === index" class="answer">
                    <p class="px-3 text-capitalize">{{ item.description }}</p>
                  </div>
                </div>
              </v-flex>
            </v-layout>
            <!-- pagination -->
            <v-layout wrap justify-center pt-2>
              <v-flex xs12>
                <div class="text-center pb-5" v-if="pages > 0">
                  <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
                </div>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex xs12 v-else>
            <v-layout wrap justify-center>
              <v-flex xs12 class="text-center">
                <span>No Data Found !</span>
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
          <span class="editbox">Edit Frequently Asked Questions</span>
          <v-spacer></v-spacer>
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-layout wrap justify-start px-2>
              <v-flex xs12 pt-4>
                <span class="label">
                  Question<v-icon size="10px" color="red">mdi-asterisk</v-icon>
                </span>

                <v-text-field v-model="editingitem.question" required outlined dense class="pt-2 text-des rounded-lg"
                  :hide-details="true">
                </v-text-field>
              </v-flex>
              <v-flex xs12 pt-4>
                <span class="label">
                  Answer
                  <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>

                <v-textarea v-model="editingitem.answer" required outlined dense class="pt-2 text-des rounded-lg"
                  :hide-details="true"></v-textarea>
              </v-flex>
            </v-layout>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>

        <v-card-actions class="py-4 justify-end headline grey lighten-2">
          <v-btn outlined color="grey" text @click="(editdialog = false), getData()"><span
              style="color: black">Cancel</span>
          </v-btn>

          <v-btn dark color="#1A73E9" @click="validateUpdate()" class="rounded-lg carousaladdedit">
            <span style="text-transform: none">Save</span>
          </v-btn>
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
            Are you sure you want to delete this question?
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
import siteContentAPI from "@/api/modules/siteContent";
import { VueEditor } from "vue2-editor";
import { files } from "@/api";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  mixins: [permissionMixin],
  components: {
    VueEditor,
  },
  data() {
    return {
      openIndex: null,
      // openIndexes: [],

      ServerError: false,
      deletedialog: false,
      dialog: false,
      adddialog: false,
      question: "",
      answer: "",
      priority: "",
      uploadedFileName: "",
      uploadedIconUrl: "", // Store uploaded icon URL
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
      currentPage: this.$store.state.currentPage || 1,
      pages: 0,
      limit: 10,
    };
  },
  watch: {
    currentPage() {
      this.$store.commit("changeTaxcreditCurrentPage", this.currentPage);
      this.getData();
    },
    keyword() {
      this.currentPage = 1;
      this.getData();
    },
  },
  mounted() {
    if (this.$store.state.currentPage) {
      this.currentPage = this.$store.state.currentPage;
      this.getData();
    } else {
      this.getData();
    }
  },
  methods: {
    togglePanel(index) {
      this.openIndex = this.openIndex === index ? null : index;
    },
    closeDialog() {
      this.adddialog = false;
      this.resetForm();
      this.getData();
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
      } else if (!this.uploadedIconUrl && !this.file) {
        this.msg = "Please Provide Icon";
        this.showSnackBar = true;
        return;
      } else {
        this.add();
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click(); // Programmatically trigger the file input
    },
    async uploadDoc(event) {
      const file = event.target.files[0];
      this.uploadedIconUrl = file.iconUrl;
      this.uploadedFileName = file.name;
      this.file = file; // Keep for backward compatibility
      this.msg = "Icon uploaded successfully";
      this.showSnackBar = true;
    },

    async add() {
      this.appLoading = true;

      try {
        // Create tax credit with JSON data (no multipart form)
        const created = await siteContentAPI.createTaxCredit({
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

    async getData() {
      this.appLoading = true;

      try {
        const list = await siteContentAPI.listTaxCredits({
          page: this.currentPage, // Already 1-based in current implementation
          size: this.limit,
        });

        if (list.success) {
          this.taxcreditlist = list.data || [];
          this.pages = Math.ceil(list.metadata.total / this.limit);
        } else {
          throw new Error(list.message);
        }
      } catch (error) {
        this.handleError(error.message || "Failed to load tax credits");
      } finally {
        this.appLoading = false;
      }
    },
    showFullDescription(desc) {
      this.fullDescription = desc;
      this.dialogdes = true;
    },
    editItem(item) {
      const itemId = item.id || item._id; // Support both new and old format
      this.$router.push("/edit_tax_credits?id=" + itemId);
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
    async deleteItem(item) {
      this.appLoading = true;

      try {
        const itemId = item.id || item._id; // Support both new and old format
        const result = await siteContentAPI.deleteTaxCredit(itemId);

        if (result.success) {
          this.msg = result.message || "Tax credit deleted successfully";
          this.showSnackBar = true;
          await this.getData();
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        this.handleError(error.message || "Failed to delete tax credit");
      } finally {
        this.appLoading = false;
      }
    },

    // New helper methods
    resetForm() {
      this.name = "";
      this.shortdesc = "";
      this.details = "";
      this.file = null;
      this.uploadedFileName = "";
      this.uploadedIconUrl = "";
      this.description = "";
    },

    handleError(message) {
      console.error("Tax credits error:", message);
      this.msg = message;
      this.showSnackBar = true;
      this.appLoading = false;
      this.ServerError =
        message.includes("server error") ||
        message.includes("unexpected error");
    },

    // Handle both old and new icon URL formats
    getIconUrl(item) {
      console.log(item.icon);
      // Check if item.icon exists and is a string
      if (!item.icon?.filePath || typeof item.icon?.filePath !== "string") {
        return ""; // Return empty string for missing or invalid icons
      }

      // If item.icon is already a full URL (new format), use it directly
      if (item.icon?.filePath.startsWith("http://") || item.icon?.filePath.startsWith("https://")) {
        return item.icon?.filePath;
      }

      // Otherwise, use the old format with mediaURL
      return this.mediaURL + item.icon?.filePath;
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
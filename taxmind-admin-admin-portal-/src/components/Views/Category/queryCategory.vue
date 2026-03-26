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
      <v-flex pt-2 xs12 sm12 md12 lg12 xl12>
        <!-- Header Section -->
        <v-layout wrap justify-start>
          <v-flex xs12>
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-layout wrap justify-end pb-3>
                  <v-flex xs12 sm6 md4 lg4 pr-lg-2 pl-lg-2 pl-md-2 pl-sm-2 pl-0 pr-sm-2 pr-md-2 pr-2 pb-2>
                    <PermissionButton v-if="canCreate('categories')" module-name="categories" permission="create"
                      color="#1A73E9" dark class="rounded-lg carousaladdedit" @click="adddialog = true">
                      <span style="text-transform: none">+ Add Category</span>
                    </PermissionButton>
                  </v-flex>
                  <v-dialog v-model="adddialog" max-width="700px">
                    <v-card rounded="lg">
                      <v-card-title>
                        <span class="editbox">Add Category</span>
                        <v-spacer></v-spacer>
                        <v-btn color="red" icon @click="closeDialog()">
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                      </v-card-title>

                      <v-card-text>
                        <v-form ref="addForm">
                          <v-layout wrap justify-center px-2>
                            <v-flex xs12 pt-4>
                              <span class="label">Category Name
                                <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                              <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="catName"
                                required outlined dense :hide-details="true"></v-text-field>
                            </v-flex>
                          </v-layout>
                        </v-form>
                      </v-card-text>

                      <v-divider></v-divider>

                      <v-card-actions class="py-4 justify-end headline grey lighten-2">
                        <v-btn outlined color="grey" text @click="closeDialog()"><span
                            style="color: black">Cancel</span>
                        </v-btn>
                        <v-btn dark color="#1A73E9" @click="validate()" class="rounded-lg carousaladdedit">
                          <span style="text-transform: none">Save</span>
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </v-layout>

                <v-data-table :headers="headers" :items="catlist" hide-default-footer :items-per-page="limit"
                  class="elevation-0" style="cursor: pointer">
                  <template v-slot:[`item.slno`]="{ index }">
                    <span v-if="currentPage > 1">
                      {{ (currentPage - 1) * limit + index + 1 }}
                    </span>
                    <span v-else>{{ index + 1 }}</span>
                  </template>
                  <template v-slot:[`item.end_date`]="{ item }">
                    <span>
                      {{ formatDate(item.end_date) }}
                    </span>
                  </template>
                  <!-- Add this template for the Actions column -->
                  <template v-slot:[`item.actions`]="{ item }">
                    <v-icon v-if="canEdit('categories')" small class="mr-2" @click.stop="editItem(item)">
                      mdi-pencil
                    </v-icon>
                    <v-icon v-if="canDelete('categories')" small @click.stop="openDeleteDialog(item)">
                      mdi-delete
                    </v-icon>
                  </template>
                </v-data-table>
              </v-flex>
            </v-layout>

            <!-- pagination -->

            <v-layout wrap justify-center pt-2>
              <v-flex xs12>
                <div class="text-center pb-5" v-if="pages > 1">
                  <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle>
                  </v-pagination>
                </div>
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
          <span class="editbox">Edit Category</span>
          <v-spacer></v-spacer>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-layout wrap justify-start px-2>
              <v-flex xs12 pt-4>
                <span class="label">
                  Category Name<v-icon size="10px" color="red">mdi-asterisk</v-icon>
                </span>

                <v-text-field v-model="editingitem.name" required outlined dense class="pt-2 text-des rounded-lg"
                  :hide-details="true">
                </v-text-field>
              </v-flex>
            </v-layout>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="py-4 justify-end headline grey lighten-2">
          <v-btn outlined color="grey" text @click="(editdialog = false), getData()"><span
              style="color: black">Cancel</span>
          </v-btn>

          <v-btn dark color="#1A73E9" @click="validateUpdate()" class="rounded-lg btnstyle">
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
          <span class="ml-2">Confirm Approval</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">
            Do you want to delete this category?
            <br />
            This action <strong>cannot be undone</strong>.
          </div>
          <v-divider class="my-3"></v-divider>
          <v-row class="pt-2" no-gutters>
            <v-col>
              <v-icon style="color: #1a73e9">mdi-shape-plus</v-icon>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="d-flex justify-center pa-2">
          <v-btn style="font-family: DMSans; font-size: 13px; color: white" color="#cf3a45"
            @click="deletedialog = false">Cancel</v-btn>
          <v-btn style="font-family: DMSans; font-size: 13px; color: white" color="#1A73E9"
            @click="confirmDelete">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import siteContentAPI from "@/api/modules/siteContent";
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
      deletedialog: false,
      dialog: false,
      adddialog: false,
      tabValue: "tab-1",
      catName: "",
      desc: "",
      priority: "",
      dialogdes: false,
      fullDescription: "",
      catlist: [],
      category: "",
      catArray: [],
      keyword: "",
      org: "",
      orglist: [],
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      editdialog: false,
      editingitem: "",
      //   keyword: "",
      itemToDelete: null,
      headers: [
        {
          text: "Sl.No",
          value: "slno",
          align: "start",
          width: "50px",
          sortable: false,
        },
        {
          text: "Category Name",
          value: "name",
          align: "start",
          width: "260px",
          sortable: false,
        },
        {
          text: "Actions",
          value: "actions",
          align: "center",
          width: "100px",
          sortable: false,
        },
      ],

      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 20,
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
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB").replace(/\//g, "-");
    },
    winStepper(item) {
      window.scrollTo(0, 0);
      if (item.ref == "page1Tab") {
        if (item.level) {
          this.tabValue = item.level;
        }
      }
    },
    closeDialog() {
      this.adddialog = false;
      this.catName = ''
      this.getData();
    },

    validate() {
      if (!this.catName || !this.catName.trim()) {
        this.msg = "Please Provide Category Name";
        this.showSnackBar = true;
        return;
      } else {
        this.add();
      }
    },

    async add() {
      this.appLoading = true;

      try {
        const response = await siteContentAPI.createQueryCategory({
          name: this.catName,
        });

        if (response.data.success) {
          this.msg = response.data.message;
          this.showSnackBar = true;
          this.adddialog = false;
          this.catName = "";
          await this.getData();
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        this.handleError(
          error.response?.data?.message || "Failed to create query category"
        );
      } finally {
        this.appLoading = false;
      }
    },

    async getData() {
      this.appLoading = true;

      try {
        const response = await siteContentAPI.getQueryCategories({
          page: this.currentPage,
          size: this.limit,
        });

        this.catlist = response.data.data || [];
        this.pages = Math.ceil(response.data.metadata.total / this.limit);
      } catch (error) {
        this.handleError(
          error.response?.data?.message || "Failed to load query categories"
        );
      } finally {
        this.appLoading = false;
      }
    },

    validateUpdate() {
      if (!this.editingitem.name || !this.editingitem.name.trim()) {
        this.msg = "Please Provide Category Name";
        this.showSnackBar = true;
        return;
      } else {
        this.edit();
      }
    },
    editItem(item) {
      this.editingitem = item;
      this.editdialog = true;
    },

    async edit() {
      this.appLoading = true;

      try {
        const categoryId = this.editingitem.id || this.editingitem._id; // Support both formats
        const response = await siteContentAPI.updateQueryCategory(categoryId, {
          name: this.editingitem.name,
        });

        if (response.data.success) {
          this.editdialog = false;
          this.msg = response.data.message;
          this.showSnackBar = true;
          await this.getData();
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        this.handleError(
          error.response?.data?.message || "Failed to update query category"
        );
      } finally {
        this.appLoading = false;
      }
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
        const categoryId = r.id || r._id; // Support both formats
        const response = await siteContentAPI.deleteQueryCategory(categoryId);

        if (response.data.success) {
          this.msg = response.data.message;
          this.showSnackBar = true;
          await this.getData();
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        this.handleError(
          error.response?.data?.message || "Failed to delete query category"
        );
      } finally {
        this.appLoading = false;
      }
    },

    // New helper method for error handling
    handleError(message) {
      console.error("Query Category error:", message);
      this.msg = message;
      this.showSnackBar = true;
      this.appLoading = false;
      this.ServerError =
        message.includes("server error") ||
        message.includes("unexpected error");
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
</style>
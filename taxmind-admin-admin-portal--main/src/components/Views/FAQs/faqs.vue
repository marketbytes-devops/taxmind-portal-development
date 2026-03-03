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
          <v-flex xs12 sm8 md9 lg10 text-start align-center pt-2 class="carousalhead">Frequently Asked Questions
          </v-flex>
          <v-flex xs12 sm4 md3 lg2 text-end align-center>
            <PermissionButton v-if="canCreate('faqs')" module-name="faqs" permission="create" color="#1A73E9" dark
              class="rounded-lg carousaladdedit" @click="adddialog = true">
              <span style="text-transform: none">+ Add Questions</span>
            </PermissionButton>
          </v-flex>

          <v-dialog v-model="adddialog" max-width="700px">
            <v-card rounded="lg">
              <v-card-title>
                <span class="editbox">ADD Questions</span>
                <v-spacer></v-spacer>
                <v-btn color="red" icon @click="adddialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <v-form ref="addForm">
                  <v-layout wrap justify-center px-2>
                    <!-- <v-flex xs12>
                      <span class="label">Priority (Listing Order)</span>
                      <v-text-field
                        class="pt-2 text-des rounded-lg"
                        style="font-size: 14px"
                        v-model="priority"
                        type="number"
                        required
                        outlined
                        dense
                        :hide-details="true"
                      ></v-text-field>
                    </v-flex> -->
                    <v-flex xs12 pt-4>
                      <span class="label">Question
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="question" required
                        outlined dense :hide-details="true"></v-text-field>
                    </v-flex>

                    <v-flex xs12 pt-4>
                      <span class="label">Answer
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-textarea v-model="answer" class="pt-2 text-des rounded-lg" style="font-size: 14px" required
                        outlined dense :hide-details="true"></v-textarea>
                    </v-flex>
                  </v-layout>
                </v-form>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions class="py-4 justify-end headline grey lighten-2">
                <v-btn outlined color="grey" text @click="closeDialog()"><span style="color: black">Cancel</span>
                </v-btn>
                <PermissionButton v-if="canCreate('faqs')" module-name="faqs" permission="create" color="#1A73E9" dark
                  class="rounded-lg carousaladdedit" @click="validate()">
                  <span style="text-transform: none">Save</span>
                </PermissionButton>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12 v-if="faqlist && faqlist.length > 0">
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <div v-for="(item, index) in faqlist" :key="index" class="expansion-panel">
                  <div class="question" @click="togglePanel(index)">
                    <h3 class="pa-3" :class="{ open: openIndex === index }">
                      {{ item.question }}
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
                          <v-list-item v-if="canEdit('faqs')" @click="editItem(item)">
                            <v-icon small color="primary">mdi-pencil</v-icon>
                            <v-list-item-content class="pl-3 addChurch">Edit</v-list-item-content>
                          </v-list-item>
                          <v-list-item v-if="canDelete('faqs')" @click.stop="openDeleteDialog(item)">
                            <v-icon color="red" small>mdi-delete</v-icon>
                            <v-list-item-content class="pl-3 addChurch">Delete</v-list-item-content>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </span>
                  </div>
                  <div v-if="openIndex === index" class="answer">
                    <p class="px-3">{{ item.answer }}</p>
                  </div>
                </div>

                <!-- <div v-for="(item, index) in faqlist" :key="index" class="expansion-panel">
                                    <div class="question" @click="togglePanel(index)">
                                      <h3 :class="{ open: openIndexes.includes(index) }">{{ item.question }}</h3>
                                      <span :class="{ open: openIndexes.includes(index) }" style="font-size:25px">
                                        {{ openIndexes.includes(index) ? '_' : '+' }}
                                      </span>
                                    </div>
                                    <div v-if="openIndexes.includes(index)" class="answer">
                                      <p>{{ item.answer }}</p>
                                    </div>
                                  </div> -->
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

          <PermissionButton v-if="canEdit('faqs')" module-name="faqs" permission="edit" color="#1A73E9" dark
            class="rounded-lg carousaladdedit" @click="validateUpdate()">
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
      openIndex: null,
      // openIndexes: [],

      ServerError: false,
      deletedialog: false,
      dialog: false,
      adddialog: false,
      question: "",
      answer: "",
      priority: "",

      faqlist: [],
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
    closeDialog() {
      this.adddialog = false;
      this.question = "";
      this.answer = "";
      this.priority = "";
      if (this.$refs.addForm) {
        this.$refs.addForm.reset();
      }
    },

    validate() {
      if (!this.question) {
        this.msg = "Please Provide Question";
        this.showSnackBar = true;
        return;
      } else if (!this.answer) {
        this.msg = "Please Provide Answer";
        this.showSnackBar = true;
        return;
      } else {
        this.add();
      }
    },

    async add() {
      try {
        this.appLoading = true;
        const resp = await siteContent.createFaq({
          question: this.question,
          answer: this.answer,
        });
        this.appLoading = false;
        if (resp && resp.success) {
          this.msg = resp.message || "FAQ created";
          this.showSnackBar = true;
          this.adddialog = false;
          this.question = "";
          this.answer = "";
          this.priority = "";
          await this.getData();
        } else {
          this.msg = (resp && resp.message) || "Failed to create FAQ";
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
        const result = await siteContent.getFaqs({
          page: this.currentPage,
          size: this.limit,
        });
        this.appLoading = false;
        if (result && result.success) {
          this.faqlist = Array.isArray(result.data) ? result.data : [];
          const total = result.metadata?.total ?? 0;
          this.pages = Math.max(1, Math.ceil(total / this.limit));
        } else {
          this.ServerError = false;
          this.msg = (result && result.message) || "Failed to fetch FAQs";
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
    showFullDescription(desc) {
      this.fullDescription = desc;
      this.dialogdes = true;
    },

    validateUpdate() {
      if (!this.editingitem.question) {
        this.msg = "Please Provide Question";
        this.showSnackBar = true;
        return;
      } else if (!this.editingitem.answer) {
        this.msg = "Please Provide Answer";
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
      try {
        this.appLoading = true;
        const id = this.editingitem.id || this.editingitem._id;
        const resp = await siteContent.updateFaq(id, {
          question: this.editingitem.question,
          answer: this.editingitem.answer,
        });
        this.appLoading = false;
        if (resp && resp.success) {
          this.editdialog = false;
          this.msg = resp.message || "FAQ updated";
          this.showSnackBar = true;
          await this.getData();
        } else {
          this.msg = (resp && resp.message) || "Failed to update FAQ";
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
      try {
        const id = r.id || r._id;
        this.appLoading = true;
        const resp = await siteContent.deleteFaq(id);
        this.appLoading = false;
        if (resp && resp.success) {
          this.msg = resp.message || "FAQ deleted";
          this.showSnackBar = true;
          this.currentPage = 1;
          await this.getData();
        } else {
          this.msg = (resp && resp.message) || "Failed to delete FAQ";
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
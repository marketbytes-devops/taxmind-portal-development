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
          <v-flex xs12 sm12 md12 lg12 text-start align-center pt-2 class="carousalhead">Top Header Section
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-card>
                  <v-card-text>
                    <v-layout wrap justify-center>
                      <v-flex xs12 pt-4 lg6 sm6 md6>
                        <span class="label">Phone Number
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="phonenumber"
                          required outlined dense :hide-details="false" :rules="[rules.phoneNumber]"></v-text-field>
                      </v-flex>
                      <v-flex xs12 pt-4 lg6 sm6 md6 pl-lg-2 pl-sm-2 pl-md-2>
                        <span class="label">Email
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="email" required
                          outlined dense :hide-details="false" :rules="[rules.email]"></v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-card-text>
                  <v-card-actions class="py-4 justify-end headline grey lighten-2">
                    <v-btn v-if="canEdit('top_header')" dark color="#1A73E9" @click="validate()"
                      class="rounded-lg carousalbtnstyle">
                      <span style="text-transform: none">Save</span>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>

    <v-layout wrap justify-center>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11 pb-5>
        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">
          <v-flex xs6 sm6 md6 lg6 text-start align-center pt-2 class="carousalhead">Social Medias
          </v-flex>
          <v-flex xs6 sm6 md6 lg6 xl6 pt-3 class="text-end">
            <v-btn v-if="canCreate('top_header')" dark color="#1A73E9" @click="addsocialmediaDialog = true"
              class="rounded-lg carousaladdedit">
              <span style="color: white">+ Add</span>
            </v-btn>
          </v-flex>
          <v-dialog v-model="addsocialmediaDialog" max-width="700px">
            <v-card rounded="lg">
              <v-card-title>
                <span class="editbox">ADD SOCIAL MEDIA</span>
                <v-spacer></v-spacer>
                <v-btn color="red" icon @click="addsocialmediaDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <v-form ref="addForm">
                  <v-layout wrap justify-center px-2>
                    <v-flex xs12 pt-4>
                      <span class="label">Platform
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="platform" required
                        outlined dense :hide-details="true"></v-text-field>
                    </v-flex>

                    <v-flex xs12 pt-4 pb-4>
                      <span class="label">URL
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="url" required
                        outlined dense :hide-details="true"></v-text-field>
                    </v-flex>
                    <v-flex xs12 pt-2>
                      <span class="label">Icon (optional)</span>
                      <v-layout wrap justify-center>
                        <v-flex xs12 pa-4 align-self-center text-center style="
                            border-style: dotted;
                            border-color: #d3d3d3;
                            border-radius: 5px;
                            cursor: pointer;
                            background-color: rgba(248, 249, 249, 1);
                          " @click="triggerFileInput">
                          <v-layout wrap justify-center pt-0>
                            <v-flex xs12>
                              <v-icon small style="color: #074799">
                                mdi-cloud-upload
                              </v-icon>
                              <span style="font-family: Jost-Regular; font-size: 15px">
                                {{ uploadedFileName || "Select an icon to upload" }}
                              </span>
                              <input ref="fileInput" v-show="false" type="file" accept="image/*" @change="uploadDoc" />
                            </v-flex>
                          </v-layout>
                        </v-flex>
                        <v-flex xs12 pt-2 v-if="iconPreview">
                          <v-layout wrap justify-center>
                            <v-flex xs12 text-center>
                              <span class="label">Preview:</span>
                            </v-flex>
                            <v-flex xs12 text-center pt-2>
                              <v-img :src="iconPreview" max-width="100" max-height="100" contain
                                style="margin: 0 auto; border: 1px solid #d3d3d3; border-radius: 5px;"></v-img>
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
                <v-btn v-if="canCreate('top_header')" dark color="#1A73E9" @click="validatesocialmedia()"
                  class="rounded-lg carousaladdedit">
                  <span style="text-transform: none">Save</span>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12 v-if="socialmedia.length > 0">
            <v-layout wrap justify-center pt-4>
              <v-flex xs12>
                <v-card outlined>
                  <v-layout wrap justify-center pa-3>
                    <v-flex xs12 sm12 md12 lg12 xl12 v-for="(item, index) in socialmedia" :key="index" py-2 px-1>
                      <v-layout wrap justify-center>
                        <v-flex xs5 sm4 md4 lg4 xl4 pr-3>
                          <v-text-field v-model="item.platform" label="Platform" outlined readonly disabled
                            hide-details="auto">
                          </v-text-field>
                        </v-flex>

                        <v-flex xs5 sm4 md4 lg4 xl4 pl-3>
                          <v-text-field v-model="item.url" outlined readonly disabled label="URL" hide-details="auto">
                          </v-text-field>
                        </v-flex>

                        <v-flex xs1 sm2 md2 lg2 xl2 pl-3>
                          <v-layout wrap justify-center class="fill-height">
                            <v-flex xs12 align-self-center text-center>
                              <v-img v-if="item.icon && (item.icon.filePath || item.icon)"
                                :src="item.icon.filePath || item.icon" max-width="50" max-height="50" contain
                                style="margin: 0 auto; border: 1px solid #d3d3d3; border-radius: 5px;">
                                <template v-slot:placeholder>
                                  <v-progress-circular indeterminate color="#1A73E9" size="20"></v-progress-circular>
                                </template>
                              </v-img>
                              <v-icon v-else color="grey" size="40">mdi-image-off</v-icon>
                            </v-flex>
                          </v-layout>
                        </v-flex>

                        <v-flex xs1 sm2 md2 lg2 xl2 pl-3>
                          <v-layout wrap justify-center class="fill-height">
                            <v-flex v-if="canEdit('top_header')" xs12 sm6 md6 lg6 xl1 align-self-center
                              @click="editItem(item)" style="cursor: pointer">
                              <v-icon color="green">mdi-pencil</v-icon>
                            </v-flex>
                            <v-flex v-if="canDelete('top_header')" xs12 sm6 md6 lg6 xl1 align-self-center
                              @click="openDeleteDialog(item)" style="cursor: pointer">
                              <v-icon color="red">mdi-delete</v-icon>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex xs12 text-center v-else>
            <span>No Social Media Found!</span>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <!-- edit dialog -->
    <v-dialog v-model="editdialog" max-width="700px">
      <v-card rounded="lg">
        <v-card-title>
          <span class="editbox">Edit SOCIAL MEDIA</span>
          <v-spacer></v-spacer>
          <v-btn color="red" icon @click="editdialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form ref="addForm">
            <v-layout wrap justify-center px-2>
              <v-flex xs12 pt-4>
                <span class="label">Platform
                  <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="editingitem.platform"
                  required outlined dense :hide-details="true"></v-text-field>
              </v-flex>

              <v-flex xs12 pt-4 pb-4>
                <span class="label">URL
                  <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" v-model="editingitem.url"
                  required outlined dense :hide-details="true"></v-text-field>
              </v-flex>
              <v-flex xs12 pt-2>
                <span class="label">Icon (optional)</span>
                <v-layout wrap justify-center>
                  <v-flex xs12 pa-4 align-self-center text-center style="
                      border-style: dotted;
                      border-color: #d3d3d3;
                      border-radius: 5px;
                      cursor: pointer;
                      background-color: rgba(248, 249, 249, 1);
                    " @click="edittriggerFileInput">
                    <v-layout wrap justify-center pt-0>
                      <v-flex xs12>
                        <v-icon small style="color: #074799">
                          mdi-cloud-upload
                        </v-icon>
                        <span style="font-family: Jost-Regular; font-size: 15px">
                          {{ edituploadedFileName || "Select an icon to upload" }}
                        </span>
                        <input ref="editfileInput" v-show="false" type="file" accept="image/*"
                          @change="edituploadDoc" />
                      </v-flex>
                    </v-layout>
                  </v-flex>
                  <v-flex xs12 pt-2 v-if="editIconPreview">
                    <v-layout wrap justify-center>
                      <v-flex xs12 text-center>
                        <span class="label">Preview:</span>
                      </v-flex>
                      <v-flex xs12 text-center pt-2>
                        <v-img :src="editIconPreview" max-width="100" max-height="100" contain
                          style="margin: 0 auto; border: 1px solid #d3d3d3; border-radius: 5px;"></v-img>
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
          <v-btn outlined color="grey" text @click="closeeditDialog()"><span style="color: black">Cancel</span>
          </v-btn>
          <v-btn v-if="canEdit('top_header')" dark color="#1A73E9" @click="editvalidatesocialmedia()"
            class="rounded-lg carousaladdedit">
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
import siteContent from "@/api/modules/siteContent";
import { files } from "@/api";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      socialmedia: [],
      editingitem: {},
      addsocialmediaDialog: false,
      editdialog: false,
      deletedialog: false,
      uploadedFileName: "",
      edituploadedFileName: "",
      appLoading: false,
      itemToDelete: null,
      platform: "",
      url: "",
      icon: "",
      file: null,
      editfile: null,
      iconPreview: null,
      editIconPreview: null,
      phonenumber: "",
      email: "",
      rules: {
        phoneNumber: (v) => {
          const pattern =
            /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
          return pattern.test(v) || "Invalid phone number";
        },
        email: (v) => {
          const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return pattern.test(v) || "Invalid email";
        },
      },
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput && this.$refs.fileInput.click();
    },
    uploadDoc(event) {
      const file = event.target?.files?.[0];
      if (file) {
        this.file = file;
        this.uploadedFileName = file.name;
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.iconPreview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    openDeleteDialog(item) {
      this.itemToDelete = item;
      this.deletedialog = true;
    },
    edittriggerFileInput() {
      this.$refs.editfileInput.click(); // Programmatically trigger the file input
    },
    edituploadDoc(event) {
      const editfile = event.target?.files?.[0];
      if (editfile) {
        this.editfile = editfile;
        this.edituploadedFileName = editfile.name;
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.editIconPreview = e.target.result;
        };
        reader.readAsDataURL(editfile);
      }
    },
    editItem(item) {
      this.editingitem = { ...item };
      // Handle both object format (with filePath) and direct string format
      this.editIconPreview = item.icon?.filePath || item.icon || null;
      this.edituploadedFileName = "";
      this.editfile = null;
      this.editdialog = true;
    },
    closeDialog() {
      this.addsocialmediaDialog = false;
      this.uploadedFileName = "";
      this.platform = "";
      this.url = "";
      this.file = null;
      this.icon = "";
      this.iconPreview = null;
    },
    closeeditDialog() {
      this.editdialog = false;
      this.edituploadedFileName = "";
      this.editfile = null;
      this.editIconPreview = null;
    },
    confirmDelete() {
      if (this.itemToDelete) {
        this.deleteItem(this.itemToDelete);
      }
      this.deletedialog = false;
    },
    deleteItem(r) {
      this.appLoading = true;
      const id = r.id || r._id;
      siteContent
        .deleteSocialMediaLink(id)
        .then((res) => {
          this.appLoading = false;
          this.msg = res.message;
          this.showSnackBar = true;
          if (res.success) this.getData();
        })
        .catch((err) => {
          this.appLoading = false;
          this.ServerError =
            !!err?.response?.status && err.response.status >= 500;
          this.msg =
            err?.response?.data?.error ||
            err?.message ||
            "An error occurred.";
          this.showSnackBar = true;
          console.log(err);
        });
    },
    validate() {
      if (!this.phonenumber) {
        this.msg = "Please Provide Phone Number";
        this.showSnackBar = true;
        return;
      } else if (!this.rules.phoneNumber(this.phonenumber)) {
        this.msg = "Please provide a valid Phone Number";
        this.showSnackBar = true;
        return;
      } else if (!this.email) {
        this.msg = "Please Provide Email Address";
        this.showSnackBar = true;
        return;
      } else if (!this.rules.email(this.email)) {
        this.msg = "Please provide a valid Email Address";
        this.showSnackBar = true;
        return;
      } else {
        this.add();
      }
    },
    validatesocialmedia() {
      if (!this.platform) {
        this.msg = "Please Provide Platform";
        this.showSnackBar = true;
        return;
      } else if (!this.url) {
        this.msg = "Please Provide URL";
        this.showSnackBar = true;
        return;
      } else {
        this.addsocialmedia();
      }
    },
    editvalidatesocialmedia() {
      if (!this.editingitem.platform) {
        this.msg = "Please Provide Platform";
        this.showSnackBar = true;
        return;
      } else if (!this.editingitem.url) {
        this.msg = "Please Provide URL";
        this.showSnackBar = true;
        return;
      } else {
        this.editsocialmedia();
      }
    },
    async addsocialmedia() {
      this.appLoading = true;
      try {
        // Step 1: Create social media link first without icon
        const payload = {
          platform: this.platform,
          url: this.url,
        };

        const res = await siteContent.createSocialMediaLink(payload);

        if (!res.success) {
          this.appLoading = false;
          this.msg = res.message;
          this.showSnackBar = true;
          return;
        }

        // Step 2: Upload icon file if provided, using the created ID
        let iconUrl = null;
        if (this.file && res.data?.id) {
          const uploaded = await files.uploadFile(
            { entityId: res.data.id, type: "social_media_logo" },
            this.file
          );
          iconUrl = uploaded?.url || null;

          // Step 3: Update the social media link with the icon URL
          if (iconUrl) {
            // await siteContent.updateSocialMediaLink(res.data.id, {
            //   platform: this.platform,
            //   url: this.url,
            //   icon: iconUrl,
            // });
          }
        }

        this.appLoading = false;
        this.msg = res.message;
        this.showSnackBar = true;
        this.addsocialmediaDialog = false;
        this.platform = "";
        this.url = "";
        this.icon = "";
        this.file = null;
        this.uploadedFileName = null;
        this.iconPreview = null;
        this.getData();
      } catch (err) {
        this.appLoading = false;
        this.ServerError =
          !!err?.response?.status && err.response.status >= 500;
        this.msg =
          err?.response?.data?.error ||
          err?.message ||
          "An error occurred.";
        this.showSnackBar = true;
        console.log(err);
      }
    },
    async editsocialmedia() {
      this.appLoading = true;
      try {
        const id = this.editingitem.id || this.editingitem._id;
        let iconUrl = this.editingitem.icon;

        // Upload new icon file if provided
        if (this.editfile) {
          const uploaded = await files.uploadFile(
            { entityId: id, type: "social_media_logo" },
            this.editfile
          );
          iconUrl = uploaded?.url || iconUrl;
        }

        const payload = {
          platform: this.editingitem.platform,
          url: this.editingitem.url,
          ...(iconUrl ? { icon: iconUrl } : {}),
        };

        const res = await siteContent.updateSocialMediaLink(id, payload);
        this.appLoading = false;
        this.msg = res.message;
        this.showSnackBar = true;
        if (res.success) {
          this.editdialog = false;
          this.editfile = null;
          this.edituploadedFileName = null;
          this.editIconPreview = null;
          this.getData();
        }
      } catch (err) {
        this.appLoading = false;
        this.ServerError =
          !!err?.response?.status && err.response.status >= 500;
        this.msg =
          err?.response?.data?.error ||
          err?.message ||
          "An error occurred.";
        this.showSnackBar = true;
        console.log(err);
      }
    },

    add() {
      const data = {
        headerPhone: this.phonenumber,
        headerEmail: this.email,
      };
      this.appLoading = true;
      siteContent
        .updateSiteConfig(data)
        .then((res) => {
          this.appLoading = false;
          this.msg = res.message || "Header updated successfully";
          this.showSnackBar = true;
          if (res.success) {
            this.getData();
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.ServerError =
            !!err?.response?.status && err.response.status >= 500;
          this.msg =
            err?.response?.data?.error ||
            err?.message ||
            "An error occurred.";
          this.showSnackBar = true;
          console.log(err);
        });
    },

    getData() {
      this.appLoading = true;
      Promise.all([siteContent.getSiteConfig(), siteContent.listSocialMedia()])
        .then(([config, media]) => {
          this.appLoading = false;
          if (config.success) {
            this.phonenumber = config.data?.headerPhone || "";
            this.email = config.data?.headerEmail || "";
          }
          if (media.success) {
            this.socialmedia = media.data || [];
          }
        })
        .catch((err) => {
          this.appLoading = false;
          this.ServerError =
            !!err?.response?.status && err.response.status >= 500;
          this.msg =
            err?.response?.data?.error ||
            err?.message ||
            "An error occurred.";
          this.showSnackBar = true;
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
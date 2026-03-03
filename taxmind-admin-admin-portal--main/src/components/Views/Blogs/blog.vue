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
          <v-flex xs12 sm3 md3 lg10 text-start align-center pt-2 class="carousalhead">Blogs
          </v-flex>
          <v-flex xs12 sm9 md9 lg2 text-end align-center>
            <PermissionButton module-name="blogs" permission="create" color="#1A73E9" class="rounded-lg carousaladdedit"
              @click="adddialog = true" dark>
              <span style="text-transform: none">+ Add</span>
            </PermissionButton>
          </v-flex>

          <v-dialog v-model="adddialog" max-width="700px">
            <v-card rounded="lg">
              <v-card-title>
                <span class="editbox">ADD Blog</span>
                <v-spacer></v-spacer>
                <v-btn color="red" icon @click="adddialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <v-form ref="addForm">
                  <v-layout wrap justify-center px-2>
                    <v-flex xs12 pt-4>
                      <span class="label">Title
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <v-text-field class="pt-2 text-des rounded-lg" style="font-size: 14px" required outlined dense
                        :hide-details="true" v-model="title"></v-text-field>
                    </v-flex>
                    <v-flex xs12 pt-4>
                      <span class="label">Description
                        <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <vue-editor class="pt-2 text-des" style="font-size: 14px" v-model="desc"></vue-editor>
                    </v-flex>

                    <v-flex xs12 pr-2 pt-3>
                      <span class="label">
                        Upload Image<v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                      <ImageComp class="pt-2 text-des" :height="327" :width="584.6" :singleimg="image"
                        @stepper="winStepper" :componentType="'carouselImage'" />
                    </v-flex>
                  </v-layout>
                </v-form>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions class="py-4 justify-end headline grey lighten-2">
                <v-btn outlined color="grey" text @click="closeDialog()"><span style="color: black">Cancel</span>
                </v-btn>
                <!-- <v-btn color="primary"  @click="validate()">Save</v-btn> -->
                <v-btn dark color="#1A73E9" @click="validate()" class="rounded-lg btnstyle">
                  <span style="text-transform: none">Save</span>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <!-- Table section -->
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-card>
                  <v-card-text>
                    <v-layout wrap justify-start v-if="carousellist?.length > 0">
                      <v-flex xs12 sm6 md4 lg3 v-for="(item, index) in carousellist" :key="index" class="d-flex mb-3">
                        <v-layout wrap justify-center @click="openBlogDetail(item)">
                          <v-flex xs12>
                            <v-card class="video-card" elevation="1" height="100%">
                              <v-flex xs12>
                                <v-img :src="getBlogCardImage(item)" max-height="300px" max-width="100%"><template
                                    v-slot:placeholder>
                                    <ImageLoader />
                                  </template></v-img>
                              </v-flex>

                              <v-flex text-start pb-0 style="flex-grow: 1">
                                <v-layout wrap justify-start>
                                  <v-flex xs10 py-2 pt-4 pl-3>
                                    <span class="video-title">
                                      {{ item.title }}
                                    </span>
                                  </v-flex>
                                  <v-flex xs2 class="d-flex align-center justify-end">
                                    <v-menu offset-y>
                                      <template v-slot:activator="{ on, attrs }">
                                        <v-btn v-bind="attrs" v-on="on" icon>
                                          <v-icon color="black">mdi-dots-vertical</v-icon>
                                        </v-btn>
                                      </template>
                                      <v-list>
                                        <v-list-item v-if="canEdit('blogs')" @click="editItem(item)">
                                          <v-icon small color="primary">mdi-pencil</v-icon>
                                          <v-list-item-content class="pl-3 addChurch">Edit</v-list-item-content>
                                        </v-list-item>
                                        <v-list-item v-if="canDelete('blogs')" @click.stop="openDeleteDialog(item)">
                                          <v-icon color="red" small>mdi-delete</v-icon>
                                          <v-list-item-content class="pl-3 addChurch">Delete</v-list-item-content>
                                        </v-list-item>
                                      </v-list>
                                    </v-menu>
                                  </v-flex>
                                </v-layout>
                                <!-- <v-flex pt-1>
                                  <v-divider></v-divider>
                                </v-flex> -->
                                <!-- <v-flex px-3 class="live-des mt-1">
                                  <span
                                    @click.stop="
                                      item.content &&
                                        item.content.length > 40 &&
                                        showFullDescription(item.content)
                                    "
                                  >
                                    {{
                                      item.content ? item.content.slice(0, 40) : ""
                                    }}</span
                                  >
                                  <span
                                    v-if="item.content && item.content.length > 40"
                                    >....</span
                                  >
                                </v-flex> -->
                              </v-flex>
                            </v-card>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                    </v-layout>
                    <v-layout v-else>
                      <v-flex text-center style="font-size: medium" class="addChurch">
                        No blogs found!
                      </v-flex>
                    </v-layout>
                  </v-card-text>
                </v-card>
              </v-flex>
            </v-layout>
            <!-- pagination -->
            <v-layout wrap justify-center pt-2>
              <v-flex xs12>
                <div class="text-center pb-5" v-if="pages > 1">
                  <v-pagination 
                    :length="pages" 
                    v-model="currentPage" 
                    color="#1A73E9" 
                    :total-visible="7"
                    circle
                  ></v-pagination>
                </div>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <!-- description dialog-box -->

    <v-dialog v-model="dialogdes" max-width="600px">
      <v-card>
        <v-card-title class="card-header">Description</v-card-title>
        <v-card-text class="text-des pt-3">
          <span v-html="fullDescription"></span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn style="font-family: interregular; font-size: 13px; color: white" color="#1A73E9"
            @click="dialogdes = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--edit dialog  -->
    <v-dialog v-model="editdialog" max-width="700px">
      <v-card rounded="lg">
        <v-card-title>
          <span class="editbox">Edit Blog</span>
          <v-spacer></v-spacer>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-layout wrap justify-start px-2>
              <!-- {{ editingitem.image }} -->

              <v-flex xs12 pt-4>
                <span class="label">
                  Title<v-icon size="10px" color="red">mdi-asterisk</v-icon>
                </span>

                <v-text-field v-model="editingitem.title" required outlined dense class="pt-2 text-des rounded-lg"
                  :hide-details="true">
                </v-text-field>
              </v-flex>
              <v-flex xs12 pt-4>
                <span class="label">
                  Description
                  <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                <vue-editor class="pt-2 text-des" style="font-size: 14px" v-model="editingitem.content"></vue-editor>
              </v-flex>
              <v-flex xs12 pr-2 pt-3>
                <span class="label">
                  Upload Image<v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                <ImageComp class="pt-2 text-des" :height="327" :width="584.6" :singleimg="editingitem.image"
                  @stepper="winStepper" :componentType="'carouselImage'" />
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
          <span class="ml-2">Confirm Deletion</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">
            Are you sure you want to delete this Blog?
            <br />
            This action <strong>cannot be undone</strong>.
          </div>
          <v-divider class="my-3"></v-divider>
          <v-row class="pt-2" no-gutters>
            <v-col>
              <!-- <img src="@/assets/images/cat_icon.png" width="40px" height="40px" class="dialog-icon" /> -->

              <v-icon style="color: #1a73e9">mdi-shape-plus</v-icon>
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
// Migrated to new Blogs API module using resource routes (/blogs)
import ImageComp from "@/components/Common/carouselImageCrop";
import { VueEditor } from "vue2-editor";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';
import { blogs, files } from "@/api"; // use files.uploadBlogImage presigned flow

export default {
  components: {
    ImageComp,
    VueEditor,
    PermissionButton,
  },
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      dialog: false,
      adddialog: false,
      title: "",
      desc: "",
      image: null,
      carouselImage: "",
      dialogdes: false,
      fullDescription: "",
      carousellist: [], // TODO: rename to blogsList; keeping for minimal diff
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
      editdialog: false,
      editingitem: "",
      //   keyword: "",
      itemToDelete: null,
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 10,
    };
  },
  mounted() {
    this.getData();
  },
  watch: {
    currentPage() {
      this.getData();
    },
  },
  methods: {
    redirecttoBlogDetails(item) {
      // Redirect to another page with the user ID as a parameter
      this.$router.push({ name: "user_view", query: { id: item._id } });
    },
    winStepper(window_data) {
      if (window_data.type == "carouselImage") {
        this.carouselImage = window_data.selectedFiles;
      }
    },
    closeDialog() {
      this.adddialog = false;
      this.getData();
    },
    validate() {
      if (!this.title) {
        this.msg = "Please Provide Title";
        this.showSnackBar = true;
        return;
      } else if (!this.desc) {
        this.msg = "Please Provide Description";
        this.showSnackBar = true;
        return;
      } else if (!this.carouselImage) {
        this.msg = "Please Provide Image";
        this.showSnackBar = true;
        return;
      } else {
        this.add();
      }
    },
    async add() {
      this.appLoading = true;
      try {
        // 1. Create blog metadata
        const created = await blogs.createBlog({ title: this.title, content: this.desc });
        // Support shapes: { data: { id } } OR direct { id }
        const createdEntity = created?.data || created;
        const createdId = createdEntity?.id || createdEntity?._id;
        // 2. Upload image
        if (createdId && this.carouselImage) {
          await files.uploadBlogImage(createdId, this.carouselImage);
        }
        this.msg = "Blog created";
        this.showSnackBar = true;
        this.carouselImage = "";
        this.title = "";
        this.desc = "";
        this.adddialog = false;
        window.location.reload();
        await this.getData();
      } catch (err) {
        this.handleError(err);
      } finally {
        this.appLoading = false;
      }
    },
    async getData() {
      this.appLoading = true;
      try {
        const response = await blogs.listBlogs({ page: this.currentPage, limit: this.limit });
        this.carousellist = Array.isArray(response.items) ? response.items : [];
        // Calculate total pages for pagination
        const total = response.total || this.carousellist.length;
        this.pages = Math.ceil(total / this.limit);
      } catch (err) {
        this.handleError(err);
      } finally {
        this.appLoading = false;
      }
    },
    async openBlogDetail(item) {
      try {
        this.appLoading = true;
        const id = item.id || item._id;
        if (!id) {
          // fallback to existing content if id missing
          this.fullDescription = item.content || '';
          this.dialogdes = true;
          return;
        }
        const resp = await blogs.getBlog(id);
        const data = resp?.data || resp;
        this.fullDescription = data?.content || '';
        this.dialogdes = true;
      } catch (err) {
        this.handleError(err);
      } finally {
        this.appLoading = false;
      }
    },
    getBlogCardImage(item) {
      const img = item && item.image;
      if (!img) return '';
      // Prefer server-provided presigned filePath, fallback to building from key
      if (img.filePath) return img.filePath;
      if (img.key && typeof files?.getFileUrl === 'function') return files.getFileUrl(img.key);
      // Fallback for any legacy string image fields
      return typeof img === 'string' ? img : '';
    },
    validateUpdate() {
      if (!this.editingitem.title) {
        this.msg = "Please Provide Title";
        this.showSnackBar = true;
        return;
      } else if (!this.editingitem.content) {
        this.msg = "Please Provide Description";
        this.showSnackBar = true;
        return;
      } else if (!this.editingitem.image && !this.carouselImage) {
        // For edit, allow using either existing image (editingitem.image) or a newly selected one (carouselImage)
        this.msg = "Please Provide Image";
        this.showSnackBar = true;
        return;
      } else {
        this.edit();
      }
    },
    async editItem(item) {
      try {
        this.appLoading = true;
        const id = item.id || item._id;
        if (!id) {
          // Fallback to existing item if no id present
          this.editingitem = { ...item };
          this.editdialog = true;
          return;
        }
        const resp = await blogs.getBlog(id);
        const data = resp?.data || resp || {};
        this.editingitem = {
          id: data.id || data._id || id,
          title: data.title || '',
          content: data.content || '',
          // Prefer full URL if provided by API; else fall back to key/legacy
          image: (data.image && (data.image.filePath || data.image.key))
            ? (data.image.filePath || data.image.key)
            : (item && item.image && (item.image.filePath || item.image.key || item.image)) || '',
          imageKey: data.image?.key || null,
        };
        // Clear any staged new image selection
        this.carouselImage = '';
        this.editdialog = true;
      } catch (err) {
        this.handleError(err);
      } finally {
        this.appLoading = false;
      }
    },
    async edit() {
      this.appLoading = true;
      try {
        const blogId = this.editingitem._id || this.editingitem.id;
        await blogs.updateBlog(blogId, { title: this.editingitem.title, content: this.editingitem.content });
        if (this.carouselImage && blogId) {
          await files.uploadBlogImage(blogId, this.carouselImage);
        }
        this.editdialog = false;
        this.msg = "Blog updated";
        this.showSnackBar = true;
        this.carouselImage = '';
        await this.getData();
      } catch (err) {
        this.handleError(err);
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
        const blogId = r._id || r.id;
        await blogs.deleteBlog(blogId);
        this.msg = "Blog deleted";
        this.showSnackBar = true;
        await this.getData();
      } catch (err) {
        this.handleError(err);
      } finally {
        this.appLoading = false;
      }
    },
    handleError(err) {
      if (err?.response?.status === 500) {
        this.ServerError = true;
        this.msg = "A server error occurred. Please try again later.";
      } else {
        this.ServerError = false;
        this.msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "An error occurred.";
      }
      this.showSnackBar = true;
      // eslint-disable-next-line no-console
      console.error(err);
    }
  },
};
</script>

<style scoped>
.dialog-card {
  font-family: interbold, sans-serif;
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
  font-family: interbold, sans-serif;
  text-transform: uppercase;
}

.video-duration {
  color: grey;
  font-size: 12px;
}

.card-header {
  background-color: #f5f5f5;
  padding: 16px;
  font-family: intermedium, sans-serif;
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
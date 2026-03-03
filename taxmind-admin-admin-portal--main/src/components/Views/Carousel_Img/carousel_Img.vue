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
          <v-flex xs12 sm3 md3 lg10 text-start align-center pt-2 class="carousalhead">Carousel Images
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
                        <span class="label">Title
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <vue-editor v-model="title" :disabled="!canEdit('home_carousel')"></vue-editor>
                      </v-flex>
                      <v-flex xs12 pt-4>
                        <span class="label">Description
                          <v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <vue-editor v-model="desc" :disabled="!canEdit('home_carousel')"></vue-editor>
                      </v-flex>

                      <v-flex xs12 pr-2 pt-3>
                        <span class="label">

                          Upload Image<v-icon size="10px" color="red">mdi-asterisk</v-icon></span>
                        <ImageComp @stepper="winStepper" :height="'734'" :width="'1728'" :photos="carouseldata.images"
                          :showDelete="canDelete('home_carousel')" :canEdit="canEdit('home_carousel')" />
                      </v-flex>
                    </v-layout>
                  </v-card-text>
                  <v-card-actions class="py-4 justify-end headline grey lighten-2">
                    <PermissionButton v-if="canEdit('home_carousel')" module-name="home_carousel" permission="edit"
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
    <!-- delete dialog -->
    <v-dialog v-model="deletedialog" max-width="600">
      <v-card class="dialog-card">
        <v-card-title class="grey lighten-2 d-flex justify-center">
          <v-icon color="red" size="32">mdi-alert</v-icon>
          <span class="ml-2">Confirm Deletion</span>
        </v-card-title>
        <v-card-text class="py-5 text-center text-des">
          <div class="body-1">
            Are you sure you want to delete this Category?
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
import siteContentAPI from "@/api/modules/siteContent";
import ImageComp from "@/components/Common/multipleimageCrop";
import { VueEditor } from "vue2-editor";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';

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
      carouselImage: [],
      dialogdes: false,
      fullDescription: "",
      carouseldata: [], // Site configuration data
      carouselImages: [], // Separate array for carousel images
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
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    async winStepper(window_data) {
      if (window_data.type == "image") {
        this.imageArray = window_data.imageArray;
        this.imageFiles.push(window_data.selectedFiles);

        // Handle image upload immediately
        try {
          await this.handleImageUploads();
          // Clear the image arrays after successful upload
          this.imageArray = [];
          this.imageFiles = [];
          // Refresh the carousel images
          await this.refreshCarouselImages();
          window.location.reload();
          this.msg = "Image uploaded successfully";
          this.showSnackBar = true;
        } catch (error) {
          this.handleError(error.message || "Failed to upload image");
        }
      } else if (window_data.type == "imageDeletion") {
        if (window_data.response.status) {
          // Handle image deletion using new API
          if (window_data.imageId) {
            await this.deleteCarouselImage(window_data.imageId);
          } else {
            await this.getData();
          }
        }
      }
    },

    // New method for handling multiple image uploads
    async handleImageUploads() {
      const uploadPromises = this.imageFiles.map(async (file) => {
        try {
          const result = await siteContentAPI.uploadCarouselImage(file);
          if (!result.success) {
            console.error(`Failed to upload ${file.name}:`, result.message);
            return {
              success: false,
              filename: file.name,
              message: result.message,
            };
          }
          return { success: true, filename: file.name };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          return {
            success: false,
            filename: file.name,
            message: error.message,
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const failedUploads = results.filter((r) => !r.success);

      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map((f) => f.filename).join(", ");
        this.handleError(`Failed to upload some images: ${failedNames}`);
      }

      // Clear the image arrays after processing
      this.imageArray = [];
      this.imageFiles = [];
    },

    // New method for deleting carousel images
    async deleteCarouselImage(imageId) {
      try {
        const result = await siteContentAPI.deleteCarouselImage(imageId);

        if (result.success) {
          this.msg = result.message || "Image deleted successfully";
          this.showSnackBar = true;
          await this.refreshCarouselImages();
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        this.handleError(error.message || "Failed to delete image");
      }
    },

    // Helper method to refresh carousel images
    async refreshCarouselImages() {
      try {
        const result = await siteContentAPI.listCarouselImages({
          page: 1,
          size: 50,
        });
        if (result.success) {
          this.carouselImages = result.data || [];
          this.carouseldata.images = this.carouselImages;
        }
      } catch (error) {
        console.error("Failed to refresh carousel images:", error);
      }
    },

    // Legacy method kept for compatibility (DEPRECATED)
    // eslint-disable-next-line no-unused-vars
    uploadImage(id) {
      console.warn("uploadImage method is deprecated, using new upload flow");
      // This method is no longer used with the new API structure
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
      }
      // else if (this.imageFiles.length === 0) {
      //   this.msg = "Please Provide Image";
      //   this.showSnackBar = true;
      //   return;
      // }
      else {
        this.add();
      }
    },

    async add() {
      this.appLoading = true;

      try {
        // Update site configuration (title and description)
        const configResult = await siteContentAPI.updateSiteConfig({
          homeTitle: this.title,
          homeContent: this.desc,
        });

        if (!configResult.success) {
          throw new Error(configResult.message);
        }

        // Handle image uploads if any
        if (this.imageFiles.length > 0) {
          await this.handleImageUploads();
        }

        this.msg = configResult.message || "Carousel updated successfully";
        this.showSnackBar = true;

        // Refresh data instead of full page reload
        window.location.reload();
        this.carouseldata.images = []; // clear the images array
        await this.getData();
      } catch (error) {
        this.handleError(error.message || "Failed to update carousel");
      } finally {
        this.appLoading = false;
      }
    },

    async getData() {
      this.appLoading = true;

      try {
        // Get site configuration for title and description
        const configResult = await siteContentAPI.getSiteConfig();
        if (configResult.success) {
          this.carouseldata = configResult.data;
          this.title = configResult.data.homeTitle || "";
          this.desc = configResult.data.homeContent || "";
        } else {
          throw new Error(configResult.message);
        }

        // Get carousel images separately
        const imagesResult = await siteContentAPI.listCarouselImages({
          page: 1,
          size: 50,
        });
        if (imagesResult.success) {
          this.carouselImages = imagesResult.data || [];
          // Update the carouseldata structure for compatibility with existing ImageComp
          this.carouseldata.images = this.carouselImages;
        } else {
          console.warn("Failed to load carousel images:", imagesResult.message);
          this.carouselImages = [];
          this.carouseldata.images = [];
        }
      } catch (error) {
        this.handleError(error.message || "Failed to load carousel data");
      } finally {
        this.appLoading = false;
      }
    },
    showFullDescription(desc) {
      this.fullDescription = desc;
      this.dialogdes = true;
    },
    editItem(item) {
      this.editingitem = item;
      this.editdialog = true;
    },

    async edit() {
      this.appLoading = true;

      try {
        // Update site configuration with new title and description
        const result = await siteContentAPI.updateSiteConfig({
          homeTitle: this.editingitem.title,
          homeContent: this.editingitem.desc,
        });

        if (!result.success) {
          throw new Error(result.message);
        }

        // Handle any new image upload if present
        if (this.carouselImage) {
          try {
            await siteContentAPI.uploadCarouselImage(this.carouselImage);
          } catch (uploadError) {
            console.warn(
              "Failed to upload new image during edit:",
              uploadError
            );
          }
        }

        this.editdialog = false;
        this.msg = result.message || "Carousel updated successfully";
        this.showSnackBar = true;
        await this.getData();
      } catch (error) {
        this.handleError(error.message || "Failed to update carousel");
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

    // Helper method for consistent error handling
    handleError(message) {
      console.error("Carousel error:", message);
      this.msg = message;
      this.showSnackBar = true;
      this.appLoading = false;
      this.ServerError =
        message.includes("server error") ||
        message.includes("unexpected error");
    },
    async deleteItem(r) {
      this.appLoading = true;

      try {
        // Use the new deleteCarouselImage method
        const imageId = r.id || r._id; // Support both new and old format
        await this.deleteCarouselImage(imageId);
      } catch (error) {
        this.handleError(error.message || "Failed to delete carousel item");
      } finally {
        this.appLoading = false;
      }
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
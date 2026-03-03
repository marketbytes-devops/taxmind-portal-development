<template>
  <div>
    <!-- Global snackbar used via this.$snackbar -->
    <v-layout wrap>
      <v-flex xs12 md12 align-self-center>
        <v-card
          :elevation="0"
          color="#F5F5F5"
          style="border: 1px solid #cccccc"
          outlined
          :ripple="false"
          class="text-capitalize"
        >
          <v-layout wrap justify-end py-2 style="cursor: pointer">
            <v-flex xs1 align-self-center text-end pt-4>
              <v-img
                v-if="!singleimg && !resultImage"
                style="cursor: pointer"
                height="20px"
                src="./../../assets/file-upload.svg"
                @click="$refs.files.click()"
                contain
              />
            </v-flex>
          </v-layout>
          <v-dialog
            v-model="isCropper"
            persistent
            :width="
              $vuetify.breakpoint.name == 'xs' ||
              $vuetify.breakpoint.name == 'sm'
                ? '100vw'
                : $vuetify.breakpoint.name == 'md'
                ? '80vw'
                : $vuetify.breakpoint.name == 'lg'
                ? '35vw'
                : '40vw'
            "
          >
            <v-card class="pb-3">
              <v-card-title class="headline">
                <v-layout wrap>
                  <v-flex xs10>
                    <span
                      style="font-size: 20px; font-family: opensanssemibold"
                    >
                      Crop Image</span
                    >
                  </v-flex>
                  <v-flex xs2 text-right>
                    <v-btn
                      small
                      :ripple="false"
                      text
                      @click="isCropper = false"
                    >
                      <v-icon style="color: red">mdi-close</v-icon>
                    </v-btn>
                  </v-flex>
                </v-layout>
              </v-card-title>
              <Cropper
                ref="cropper"
                :stencil-props="{
                  aspectRatio: 1 / 1,
                }"
                class="example-cropper"
                :src="image"
              />
              <v-card-actions>
                <v-layout wrap justify-center pt-3>
                  <v-flex xs3 md3>
                    <v-btn
                      small
                      :ripple="false"
                      color="#039379"
                      class="py-2 px-5"
                      @click="cropImage"
                    >
                      <span style="color: #ffffff; font-family: opensansregular"
                        >Crop</span
                      ></v-btn
                    >
                  </v-flex>
                  <v-flex md3 xs3>
                    <v-btn
                      small
                      :ripple="false"
                      color="#039379"
                      class="py-2 px-3"
                      @click="$refs.files.click()"
                    >
                      <span style="color: #ffffff; font-family: opensansregular"
                        >Change Image</span
                      ></v-btn
                    >
                  </v-flex>
                </v-layout>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-layout wrap justify-space-between>
            <!-- Image Section (Left Side) -->
            <v-flex xs12 md2 text-left pb-3>
              <v-img
                v-if="singleimg && !resultImage"
                :src="mediaURL + singleimg"
                contain
                height="70px"
              ></v-img>
              <v-img v-else :src="resultImage" contain height="70px"> </v-img>
            </v-flex>

            <!-- Upload Button Section (Right Side) -->
            <v-flex
              v-if="singleimg || resultImage"
              xs12
              md3
              align-self-center
              pa-3
            >
              <v-layout wrap justify-center>
                <v-flex xs12>
                  <v-btn
                    color="white"
                    depressed
                    :ripple="false"
                    @click="$refs.files.click()"
                  >
                    <span
                      style="
                        color: #000000;
                        opacity: 1;
                        font-family: opensansregular;
                      "
                    >
                      UPLOAD NEW
                    </span>
                  </v-btn>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-card>
        <input
          v-show="false"
          accept="image/*"
          id="file1"
          ref="files"
          type="file"
          @change="browseImage"
        />
      </v-flex>
    </v-layout>
  </div>
</template>
  <script>
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
export default {
  props: ["singleimg", "pageId", "height", "width", "heading", "componentType"],
  components: {
    Cropper,
  },
  data() {
    return {
      image: null,
      resultImage: null,
      imageArray: [],
      // Global snackbar used via this.$snackbar
      isCropper: false,
      photos: [],
    };
  },

  methods: {
    cropImage() {
      var imageData = this.dataURLtoFile(
        this.$refs.cropper.getResult().canvas.toDataURL("image/jpeg", 0.8),
        "myimage.jpg"
      );
      this.resultImage = URL.createObjectURL(imageData);
      this.isCropper = false;
      this.$emit("stepper", {
        type: this.componentType,
        selectedFiles: imageData,
      });
    },
    dataURLtoFile(dataurl, filename) {
      var arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    },
    browseImage(event) {
      var img;
      img = new Image();
      img.src = window.URL.createObjectURL(event.target.files[0]);
      var ty = event.target.files[0];
      if (ty.size > 10485760) {
        // 10MB limit
        this.$snackbar.showError("File size should be less than 10MB");
        return;
      } else {
        img.onload = () => {
          this.isCropper = true;
          this.image = URL.createObjectURL(event.target.files[0]);
        };
      }
    },
  },
};
</script>
                
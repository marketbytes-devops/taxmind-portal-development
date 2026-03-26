<template>
    <div>
      <v-layout wrap justify-center>
        <v-flex xs12 py-2>
          <span class="textField1">Crop Image</span>
        </v-flex>
      </v-layout>
      <v-layout wrap justify-center>
        <v-flex xs12 py-2 align-self-center>
          <v-card>
            <v-layout wrap justify-center>
              <v-flex xs12 text-center align-self-center>
                <Cropper
                  ref="cropper"
                  :stencil-props="{
                    aspectRatio: cropwidth / cropheight,
                  }"
                  class="example-cropper"
                  :src="image"
                />
              </v-flex>
            </v-layout>
            <v-layout wrap justify-center py-2>
              <v-flex xs6 xl3 px-2>
                <v-btn
                  block
                  dark
                  small
                  :ripple="false"
                  color="#68D389"
                  @click="closeDialog"
                >
                  <span> Cancel </span>
                </v-btn>
              </v-flex>
              <v-flex xs6 xl3 px-2>
                <v-btn
                  block
                  dark
                  small
                  :ripple="false"
                  color="primary"
                  @click="cropImage"
                >
                  <span> Crop </span>
                </v-btn>
              </v-flex>
            </v-layout>
          </v-card>
        </v-flex>
      </v-layout>
    </div>
  </template>
  <script>
  import { Cropper } from "vue-advanced-cropper";
  import "vue-advanced-cropper/dist/style.css";
  export default {
    props: ["image", "cropwidth", "cropheight","imageType"],
    components: {
      Cropper,
    },
    data() {
      return {
        resultImage: null,
        msg: null,
      };
    },
    methods: {
      closeDialog() {
        this.$emit("stepper", {
          dialog: false,
          image: null,
        });
      },
      cropImage() {
        var imageData = this.dataURLtoFile(
          this.$refs.cropper.getResult().canvas.toDataURL("image/jpeg", 0.8),
          "myimage.jpg"
        );
        this.$emit("stepper", {
          dialog: false,
          image: imageData,
          imageType:this.imageType,
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
    },
  };
  </script>
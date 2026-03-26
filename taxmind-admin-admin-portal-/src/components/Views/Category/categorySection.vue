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
          <v-flex xs12 sm3 md3 lg10 text-start align-center pt-2 class="carousalhead">Categories</v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <!-- Table section -->

            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-tabs v-model="tabValue" grow background-color="white" color="#1A73E9">
                  <v-tab href="#tab-1">
                    <span :style="{
                      color: tabValue === 'tab-1' ? '#1A73E9' : 'black',
                      fontFamily: 'DMSans',
                    }">Query Category</span></v-tab>
                  <v-tab dark href="#tab-2">
                    <span :style="{
                      color: tabValue === 'tab-2' ? '#1A73E9' : 'black',
                      fontFamily: 'DMSans',
                    }">File Category</span></v-tab>

                  <v-tab-item value="tab-1">
                    <v-card flat>
                      <v-layout wrap justify-start py-5>
                        <v-flex xs12 pl-3 text-left>
                          <QueryCategory @stepper="winStepper" />
                        </v-flex>
                      </v-layout>
                    </v-card>
                  </v-tab-item>

                  <v-tab-item value="tab-2">
                    <v-card flat>
                      <v-layout wrap justify-start py-5>
                        <v-flex xs12 pl-3 text-left>
                          <FileCategory @stepper="winStepper" />
                        </v-flex>
                      </v-layout>
                    </v-card>
                  </v-tab-item>
                </v-tabs>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
// import http from "@/api/http";
import QueryCategory from "./queryCategory.vue";
import FileCategory from "./fileCategory.vue";
export default {
  components: {
    QueryCategory,
    FileCategory,
  },
  data() {
    return {
      ServerError: false,
      tabValue: "tab-1",
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      appLoading: false,
    };
  },

  methods: {
    winStepper(item) {
      window.scrollTo(0, 0);
      if (item.ref == "page1Tab") {
        if (item.level) {
          this.tabValue = item.level;
        }
      }
    },
  },
};
</script>

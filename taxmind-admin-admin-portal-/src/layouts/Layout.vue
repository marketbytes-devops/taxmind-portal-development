<template>
  <v-app id="inspire">
    <Header v-model="expandOnHover"></Header>

    <Sidebar :expand-on-hover.sync="expandOnHover"></Sidebar>
    <!-- <rightSidebar ></rightSidebar> -->
    <v-content style="background-color: #f1f7ff">
      <v-layout wrap>
        <v-flex xs12>
          <v-divider></v-divider>
        </v-flex>
      </v-layout>

      <router-view />
    </v-content>

    <!-- <Footer></Footer> -->
  </v-app>
</template>

<script>
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
// import rightSidebar from "./rightSidebar/Sidebar";
// import Footer from "./footer/Footer";
import { mapState, mapMutations } from "vuex";
export default {
  name: "Layout",

  components: {
    Header,
    Sidebar,
    // rightSidebar,
    // Footer
  },

  props: {
    source: String,
  },
  data: () => ({
    expandOnHover: false,
  }),
  computed: {
    ...mapState(["Customizer_drawer"]),
  },

  methods: {
    ...mapMutations({
      setCustomizerDrawer: "SET_CUSTOMIZER_DRAWER",
    }),
  },
};
</script>

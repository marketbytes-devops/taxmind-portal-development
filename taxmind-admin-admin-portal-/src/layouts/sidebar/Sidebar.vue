<template>
  <div>
    <v-navigation-drawer v-model="Sidebar_drawer" :dark="SidebarColor !== '#3B887B'" :color="SidebarColor"
      mobile-break-point="960" width="250px" clipped :right="$vuetify.rtl" mini-variant-width="70" app id="main-sidebar"
      class="elevation-4">
      <v-layout wrap py-2>
        <v-flex>
          <v-list dense nav class="mt-6 my-lg-5 my-md-5 my-sm-5 my-16">
            <v-layout align-center justify-end pl-7 class="hidden-sm-and-up">
              <v-flex xs12 sm11 md8 lg6 xl3 class="d-flex align-center">
                <v-avatar size="50" color="white">
                  <v-icon large color="rgba(4, 58, 130, 1)">mdi-account</v-icon>
                </v-avatar>
                <div class="d-flex flex-column ml-2">
                  <span style="
                      color: white;
                      font-family: opensanssemibold;
                      font-size: 15px;
                    ">Admin</span>
                </div>
              </v-flex>
            </v-layout>
            <v-list class="pt-4 pt-lg-0 pt-md-0 pt-sm-0">
              <v-list-item v-for="(item, index) in filteredAdminItems" :key="item.title"
                :class="{ 'active-item': activeItem === index }" @click="handleClick(item.to, index)">
                <v-list-item-icon class="pa-0 pl-7 mr-4">
                  <v-img height="24px" width="24px"
                    :src="activeItem === index ? item.iconblue : item.iconwhite"></v-img>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title :class="{
                    'active-text': activeItem === index,
                    'inactive-text': activeItem !== index,
                  }" style="
                      font-family: opensansregular;
                      font-size: 14px;
                      font-weight: 600;
                    ">
                    {{ item.title }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-layout wrap>
              <v-flex class="hidden-sm-and-up" pl-11 pt-2>
                <v-btn outlined @click="appLogout">
                  <v-icon color="white">mdi-logout</v-icon>
                  <span style="
                      color: white;
                      margin-left: 8px;
                      font-family: opensansregular;
                      text-transform: uppercase;
                    ">Logout</span>
                </v-btn>
              </v-flex>
            </v-layout>
          </v-list>
        </v-flex>
      </v-layout>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { mapState } from "vuex";
import permissionMixin from '@/mixins/permissionMixin';
import { SIDEBAR_ITEMS } from '@/common/constants/sidebarItems';

export default {
  name: "Sidebar",
  mixins: [permissionMixin],
  props: {
    expandOnHover: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    userRole: localStorage.getItem("role"),
    activeItem: 0,
    adminitems: SIDEBAR_ITEMS,
  }),
  computed: {
    ...mapState(["SidebarColor", "SidebarBg"]),
    Sidebar_drawer: {
      get() {
        return this.$store.state.Sidebar_drawer;
      },
      set(val) {
        this.$store.commit("SET_SIDEBAR_DRAWER", val);
      },
    },
    filteredAdminItems() {
      return this.adminitems.filter(item => {
        // Check if user has permission to access this route (including dashboard)
        return this.canAccessRoute(item.to);
      });
    },
  },
  created() {
    // Initialize the activeItem based on the current route
    const currentRoute = this.$route.path;
    this.activeItem = this.filteredAdminItems.findIndex(
      (item) => item.to === currentRoute
    );
  },

  methods: {
    handleClick(route, index) {
      this.activeItem = index;
      this.$router.push(route); // Navigate to the route
    },
    appLogout() {
      this.$store.dispatch('signOut').then(() => {
        this.$router.push('/Login');
      });
    },
  },
};
</script>
<style scoped>
.active-item {
  background-color: white;
  /* Change background color when active */
}

.active-text {
  color: #085ac6;
  /* Active text color */
}

.inactive-text {
  color: white;
  /* Inactive text color */
}

.v-list-item-icon img {
  transition: all 0.3s ease;
}
</style>
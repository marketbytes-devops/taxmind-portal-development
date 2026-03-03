<template>
  <div>
    <v-layout wrap justify-center pt-16>
      <v-flex xs12 sm12 md12 lg12 xl12 pt-4 pt-xl-12 px-2 pt-16>
        <v-layout wrap justify-center>
          <v-flex xs12 sm11 pb-10>
            <v-layout wrap justify-center>
              <v-flex xs12 hidden-md-and-up pt-0>
                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      <span style="
                          font-family: DMSans;
                          font-size: 18px;
                          color: #545353;
                          text-transform: capitalize;
                        " v-if="
                          $route.name == 'Profile Edit' ||
                          $route.name == 'Profile Details'
                        ">Profile</span>
                      <span style="
                          font-family: DMSans;
                          font-size: 18px;
                          color: #545353;
                          letter-spacing: 0px;
                          text-transform: capitalize;
                        " v-else>{{ $route.name }}</span>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-card class="mx-auto" max-width="500" tile flat>
                        <v-list>
                          <template v-for="(item, i) in navItems">
                            <v-list-item :key="item.name" link :to="item.route">
                              <v-list-item-content>
                                <v-list-item-title>
                                  <v-layout wrap justify-center py-1>
                                    <v-flex xs12>
                                      <span style="
                                          font-family: DMSans;
                                          font-size: 18px;
                                          color: #545353;
                                          letter-spacing: 0px;
                                          font-weight: 400;
                                        ">{{ item.name }}</span>
                                    </v-flex>
                                  </v-layout>
                                </v-list-item-title>
                              </v-list-item-content>
                            </v-list-item>
                            <v-divider :key="i"></v-divider>
                          </template>
                          <template>
                            <v-list-item>
                              <v-list-item-content>
                                <v-list-item-title>
                                  <v-layout wrap justify-center py-1>
                                    <v-flex xs12 @click="appLogout">
                                      <span style="
                                          font-family: DMSans;
                                          font-size: 18px;
                                          color: #545353;
                                          letter-spacing: 0px;
                                          font-weight: 400;
                                        ">Log Out</span>
                                    </v-flex>
                                  </v-layout>
                                </v-list-item-title>
                              </v-list-item-content>
                            </v-list-item>
                            <v-divider></v-divider>
                          </template>
                        </v-list>
                      </v-card>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-flex>
              <v-flex xs2 sm2 md3 lg3 xl2 text-left hidden-sm-and-down pt-10>
                <v-layout wrap justify-center>
                  <v-flex xs12 sm12>
                    <v-list color="#F1F7FF" class="itempad py-5" rounded="lg">
                      <template v-for="(item, i) in navItems">
                        <v-list-item :key="i">
                          <v-list-item-title>
                            <router-link :to="item.route">
                              <v-layout wrap py-1 justify-center>
                                <v-flex xs12 pa-2 :style="$route.path == item.route
                                  ? {
                                    'background-color': '#fff',
                                    padding: '3px',
                                    'border-radius': '5px',
                                    'border-left': '3px solid #1A73E9',
                                  }
                                  : {
                                    'background-color': '',
                                  }
                                  ">
                                  <v-icon :style="$route.path == item.route
                                    ? {
                                      'font-family': 'InterRegular',
                                      color: '#1A73E9',
                                    }
                                    : {
                                      'font-family': 'InterRegular',
                                      color: '#1C1C1C',
                                    }
                                    ">{{ item.icon }}</v-icon>
                                  &nbsp;
                                  <span :style="$route.path == item.route
                                    ? {
                                      'font-family': 'DMSans',
                                      color: '#1A73E9',
                                    }
                                    : {
                                      'font-family': 'DMSans',
                                      color: '#1C1C1C',
                                    }
                                    " style="
                                      font-size: 17px;
                                      font-family: DMSans;
                                      letter-spacing: 0px;
                                      text-transform: none;
                                      font-weight: 400;
                                    ">{{ item.name }}</span>
                                </v-flex>
                              </v-layout>
                            </router-link>
                          </v-list-item-title>
                        </v-list-item>
                      </template>
                      <v-layout wrap pb-2 pt-0 justify-center>
                        <v-flex xs12 pa-2 px-7 @click="appLogout" style="cursor: pointer">
                          <v-icon color="#1C1C1C">mdi-logout</v-icon> &nbsp;
                          <span style="
                              font-size: 17px;
                              font-family: DMSans;
                              letter-spacing: 0px;
                              font-weight: 400;
                              font-family: DMSans;
                              color: #1c1c1c;
                            ">Log out</span>
                        </v-flex>
                      </v-layout>
                    </v-list>
                  </v-flex>
                </v-layout>
              </v-flex>
              <v-flex xs12 sm12 md9 lg9 xl10 pt-3 pt-md-10>
                <v-layout wrap justify-start>
                  <v-flex xs12 sm12 md12 pt-5>
                    <router-view></router-view>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
// import axios from "axios";
export default {
  metaInfo: {
    title: "My Profile - Manage Your Tax Details with TaxMind",
    meta: [
      {
        name: "description",
        content:
          "Access and manage your TaxMind profile. Update personal details, submit tax filing documents, claim taxes, and review your claim history all in one place.",
      },
      {
        name: "keywords",
        content:
          "TaxMind profile, tax claim history, update tax details, submit tax documents, tax filing, tax consultancy, online tax management, financial records",
      },
      {
        property: "og:title",
        content: "My Profile - Manage Tax Claims & Documents with TaxMind",
      },
      {
        property: "og:description",
        content:
          "View and update your TaxMind profile, submit tax-related documents, file claims, and track your tax claim history with ease.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/profile", // Replace with the actual Profile page URL
      },
      {
        property: "og:type",
        content: "website",
      },
      { name: "robots", content: "index, follow" },
    ],
  },

  data() {
    return {
      changePicDialog: false,
      dialogCoins: false,
      navItems: [
        { name: "Profile", route: "/profile", icon: "mdi-account-outline" },
        // {
        //   name: "Claim History",
        //   route: "/claim-history",
        //   icon: "mdi-calculator-variant-outline",
        // },
        // { name: "Templates", route: "/templates", icon: "mdi-card-multiple" },
        {
          name: "Application",
          route: "/application",
          icon: "mdi-file-document-outline",
        },
        {
          name: "Password",
          route: "/change-password",
          icon: "mdi-lock-alert",
        },
        {
          name: "Support",
          route: "/customer-support",
          // route: "/",
          icon: "mdi-face-agent",
        },
        {
          name: "Privacy policy ",
          route: "/privacy-policy",
          icon: "mdi-shield-alert-outline",
        },
        // { name: "LOG OUT", route: "/Profile/logout" },
      ],
      shareDialog: false,
    };
  },
  computed: {
    //   appUser() {
    //     return this.$store.state.userData;
    //   },
  },
  beforeMount() {
    // this.getLink();
  },
  methods: {
    async appLogout() {
      console.log('Logout triggered from ProfileView sidebar');
      // Remove FCM token from backend
      const fcmToken = localStorage.getItem('fcmToken');
      const accessToken = localStorage.getItem('accesstoken') || localStorage.getItem('token');
      console.log('FCM Token:', fcmToken ? 'Found' : 'Not found');
      console.log('Access Token:', accessToken ? 'Found' : 'Not found');
      if (fcmToken && accessToken) {
        try {
          console.log('Calling FCM token removal API...');
          await this.$api.delete('/notifications/user/fcm-token', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            data: { fcmToken }
          });
          console.log('FCM token removed successfully');
        } catch (err) {
          console.error('Failed to remove FCM token:', err);
        }
      }
      this.$store.dispatch("sessionOut");
    },
  },
};
</script>
<style scoped>
.itempad {
  margin: 8%;
  padding: 3%;
}
</style>
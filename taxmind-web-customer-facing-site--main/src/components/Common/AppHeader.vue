<template>
  <div>
    <v-app-bar
      app
      elevate-on-scroll
      class="hidden-sm-and-down"
      color="#FFFFFF"
      height="140px"
    >
      <v-layout wrap justify-center fill-height>
        <!-- Top Section -->
        <v-flex xs12 sm12 md12 lg12 align-self-start>
          <AppHeader0 />
        </v-flex>
        <!-- Main Section -->
        <v-flex xs12 sm12 md11 lg11 align-self-center>
          <v-layout wrap align-center>
            <!-- Logo -->
            <v-flex sm2 md1 lg2 align-self-center>
              <v-layout wrap justify-start>
                <v-flex xs6 md10 lg10 align-self-center class="mb-4">
                  <a href="#" @click.prevent="goHome">
                    <v-img
                      src="./../../assets/headerlogo.webp"
                      height="60px"
                      contain
                    />
                  </a>
                </v-flex>
              </v-layout>
            </v-flex>
            <v-flex xs6 sm6 md7 lg8 align-self-center>
              <v-layout wrap justify-center>
                <v-flex
                  class="mb-4 headeritems"
                  v-for="(item, index) in navItems1"
                  :key="index"
                >
                  <v-layout wrap justify-center>
                    <v-flex
                      xs12
                      style="position: relative"
                      v-if="item.label === 'Tax Credits '"
                    >
                      <v-hover v-slot="{ hover }">
                        <v-flex xs12>
                          <v-layout column>
                            <!-- Main Label -->
                            <v-flex xs12>
                              <span
                                class="nav-link"
                                style="text-decoration: none; cursor: pointer"
                                active-class="active-link"
                              >
                                {{ item.label }}
                              </span>

                              <!-- Dropdown Sub-items -->
                              <v-card
                                width="100%"
                                v-if="hover"
                                class="dropdown-card"
                                elevation="3"
                                style="
                                  position: absolute;
                                  background-color: #1a73e9;
                                  z-index: 100;
                                "
                              >
                                <div class="scrollable-content">
                                  <v-list style="background-color: #1a73e9">
                                    <v-list-item
                                      v-for="(subItem, index) in taxcreditdata"
                                      :key="index"
                                      style="cursor: pointer"
                                      @click="navigateToTaxCredit(subItem.id)"
                                    >
                                      <v-list-item-title class="text-left">
                                        <v-tooltip bottom>
                                          <template
                                            v-slot:activator="{ on, attrs }"
                                          >
                                            <span
                                              v-bind="attrs"
                                              v-on="on"
                                              style="
                                                color: white;
                                                font-family: DMSans;
                                                font-weight: 400;
                                                font-size: 13px;
                                                overflow: hidden;
                                                text-overflow: ellipsis;
                                                white-space: nowrap;
                                                display: inline-block;
                                                max-width: 200px; /* Adjust as needed */
                                              "
                                            >
                                              {{ subItem.name }}
                                            </span>
                                          </template>
                                          <span
                                            style="
                                              font-size: 14px;
                                              font-family: DMSans;
                                            "
                                            >{{ subItem.name }}</span
                                          >
                                        </v-tooltip>
                                      </v-list-item-title>
                                    </v-list-item>
                                  </v-list>
                                </div>
                              </v-card>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-hover>
                    </v-flex>
                    <v-flex xs12 v-else>
                      <!-- Use router-link for navigation; Home should always go to root -->
                      <template v-if="item.route === '/'">
                        <a href="#" class="nav-link" @click.prevent="goHome">{{
                          item.label
                        }}</a>
                      </template>
                      <template v-else>
                        <router-link
                          :to="item.route"
                          class="nav-link"
                          style="text-decoration: none"
                          active-class="active-link"
                          :exact="item.route === '/'"
                        >
                          {{ item.label }}
                        </router-link>
                      </template>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-flex>
            <v-flex xs4 sm3 md4 lg2 align-self-center v-if="!appLogin">
              <v-layout wrap justify-end align-center>
                <v-flex xs12>
                  <v-layout wrap justify-center>
                    <v-flex xs12 lg6 md5 class="text-right">
                      <v-btn
                        to="/login"
                        text
                        class="mx-3 mb-5"
                        outlined
                        rounded
                      >
                        <span
                          style="
                            color: #1a73e9;
                            text-transform: capitalize;
                            font-family: DMSans;
                            font-weight: 600;
                            font-size: 16px;
                          "
                          >Login</span
                        >
                      </v-btn>
                    </v-flex>
                    <v-flex xs12 lg6 md6 class="text-left">
                      <v-btn
                        to="/apply-now"
                        text
                        class="mx-3 mb-5 headeritems"
                        outlined
                        rounded
                      >
                        <span
                          style="
                            text-transform: capitalize;
                            font-family: DMSans;
                            font-weight: 600;
                            font-size: 16px;
                          "
                          >Apply Now</span
                        >
                      </v-btn>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-flex>
            <v-flex xs4 sm3 md4 lg2 align-self-center v-if="appLogin">
              <v-layout wrap justify-center align-center>
                <v-flex xs12 pb-4>
                  <v-layout  justify-center align-center>
                    <!-- Bell Icon with Notification Menu -->
                    <v-flex shrink class="mr-2">
                      <v-menu v-model="notificationMenuOpenDesktop" offset-y nudge-bottom="10" min-width="450" right>


                        <!-- Comment off the below snippet to enable notification , show Notification bell icon -->
                        <template v-slot:activator="{ attrs, on }">
                          <v-btn icon v-bind="attrs" v-on="on" @click="() => fetchNotifications()">
                            <v-badge
                              v-if="unreadNotificationCount > 0"
                              :content="unreadNotificationCount"
                              color="red"
                              overlap
                            >
                              <v-icon color="black">mdi-bell-outline</v-icon>
                            </v-badge>
                            <v-icon v-else color="black">mdi-bell-outline</v-icon>
                          </v-btn>
                        </template>

                        <v-card max-height="400" class="overflow-y-auto">
                          <v-card-title class="text-h6 pb-2">
                            Notifications
                          </v-card-title>
                          <v-divider></v-divider>
                          
                          <div 
                            class="notification-scroll-container" 
                            style="max-height: 350px; overflow-y: auto;"
                            @scroll="onNotificationScroll"
                          >
                            <v-list v-if="notifications.length > 0" two-line>
                              <template v-for="(notification, index) in notifications">
                                <v-list-item :key="notification.id || index" class="justify-center">
                                  <v-list-item-content class="text-left">
                                    <v-list-item-title>
                                      {{ notification.title || 'Notification' }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="text-wrap">
                                      {{ notification.body || notification.message || 'No message' }}
                                    </v-list-item-subtitle>
                                    <v-list-item-subtitle class="text-caption mt-1">
                                      {{ formatDate(notification.createdAt || notification.timestamp) }}
                                    </v-list-item-subtitle>
                                  </v-list-item-content>
                                  <!-- <v-list-item-action>
                                    <v-btn icon @click="removeNotification(index)">
                                      <v-icon color="grey">mdi-close</v-icon>
                                    </v-btn>
                                  </v-list-item-action> -->
                                </v-list-item>
                                <v-divider
                                  v-if="index < notifications.length - 1"
                                  :key="'divider-' + index"
                                ></v-divider>
                              </template>
                            </v-list>
                            
                            <!-- Loading indicator for pagination -->
                            <div v-if="isLoadingMoreNotifications" class="text-center pa-2">
                              <v-progress-circular 
                                indeterminate 
                                color="primary" 
                                size="20"
                              ></v-progress-circular>
                              <span class="ml-2 text-caption">Loading more...</span>
                            </div>
                            
                            <!-- No more notifications indicator -->
                            <div v-else-if="notifications.length > 0 && !hasMoreNotifications" class="text-center pa-2">
                              <span class="text-caption grey--text">No more notifications</span>
                            </div>
                          </div>
                          
                          <v-card-text v-if="notifications.length === 0 && !isLoadingMoreNotifications" class="text-center pa-4">
                            <v-icon large color="grey lighten-1">mdi-bell-off-outline</v-icon>
                            <p class="mt-2 grey--text">No notifications</p>
                          </v-card-text>
                        </v-card>
                      </v-menu>
                    </v-flex>
                    <!-- Account Menu -->
                    <v-flex xs12 lg9 md5 class="text-right">
                      <v-menu offset-y nudge-bottom="10" nudge-right="0" right>
                        <template v-slot:activator="{ attrs, on }">
                          <v-btn
                            block
                            text
                            rounded
                            :ripple="false"
                            v-bind="attrs"
                            v-on="on"
                          >
                            <v-icon color="black" class="mr-2"
                              >mdi-account</v-icon
                            >
                            <span
                              style="
                                color: #000;
                                font-family: DMSans;
                                font-weight: 400;
                                font-size: 16px;
                                text-transform: capitalize;
                              "
                            >
                              {{ appUser }}
                              <v-icon small class="ml-2" color="black"
                                >mdi-chevron-down</v-icon
                              >
                            </span>
                          </v-btn>
                        </template>

                        <v-card tile flat elevation="1" class="pa-4">
                          <v-layout wrap justify-center>
                            <!-- Profile Link -->
                            <v-flex xs12>
                              <router-link to="/profile">
                                <v-btn
                                  block
                                  color="black"
                                  style="
                                    color: #000;
                                    font-family: DMSans;
                                    text-transform: capitalize;
                                    font-weight: 500;
                                    font-size: 16px;
                                  "
                                  text
                                >
                                  Profile
                                </v-btn>
                              </router-link>
                            </v-flex>
                            <!-- Application Link -->
                            <v-flex xs12>
                              <router-link to="/application">
                                <v-btn
                                  block
                                  color="black"
                                  style="
                                    color: #000;
                                    font-family: DMSans;
                                    text-transform: capitalize;
                                    font-weight: 500;
                                    font-size: 16px;
                                  "
                                  text
                                >
                                  Application
                                </v-btn>
                              </router-link>
                            </v-flex>
                            <!-- Logout Button -->
                            <v-flex xs12 pt-3>
                              <v-btn
                                block
                                color="black"
                                outlined
                                :ripple="false"
                                @click="handleLogout"
                              >
                                <span
                                  style="
                                    color: #1a73e9;
                                    font-family: DMSans;
                                    font-weight: 400;
                                    font-size: 16px;
                                  "
                                  >Logout</span
                                >
                              </v-btn>
                            </v-flex>
                          </v-layout>
                        </v-card>
                      </v-menu>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-app-bar>

    <v-app-bar
      app
      dark
      color="#ffffff"
      dense
      flat
      height="100px"
      class="hidden-md-and-up"
    >
      <v-layout wrap justify-center fill-height>
        <v-flex xs12 align-self-start>
          <AppHeader0 />
        </v-flex>
        <v-flex xs12 sm12>
          <v-layout wrap align-center>
            <v-flex xs2 sm2>
              <v-app-bar-nav-icon @click.native="sideNav = !sideNav">
                <v-icon color="#00715D">mdi-menu</v-icon>
              </v-app-bar-nav-icon>
            </v-flex>
            <v-flex xs7 sm7 text-center class="mb-0">
              <router-link to="/">
                <v-img
                  contain
                  height="40px"
                  src="./../../assets/headerlogo.webp"
                ></v-img>
              </router-link>
            </v-flex>
            <v-flex xs3 sm3 text-right v-if="appLogin">
              <v-menu offset-y nudge-bottom="10" min-width="350" right v-model="notificationMenuOpen">
                <template v-slot:activator="{ attrs, on }">
                  <v-btn icon v-bind="attrs" v-on="on" @click="() => fetchNotifications()">
                    <v-badge
                      v-if="unreadNotificationCount > 0"
                      :content="unreadNotificationCount"
                      color="red"
                      overlap
                    >
                      <v-icon color="black">mdi-bell-outline</v-icon>
                    </v-badge>
                    <v-icon v-else color="black">mdi-bell-outline</v-icon>
                  </v-btn>
                </template>
                <v-card max-height="400" class="overflow-y-auto">
                  <v-card-title class="text-h6 pb-2">
                    Notifications
                  </v-card-title>
                  <v-divider></v-divider>
                  <div 
                    class="notification-scroll-container" 
                    style="max-height: 350px; overflow-y: auto;"
                    @scroll="onNotificationScroll"
                  >
                    <v-list v-if="notifications.length > 0" two-line>
                      <template v-for="(notification, index) in notifications">
                        <v-list-item 
                          :key="notification.id || index" 
                          class="justify-center"
                          :style="!notification.isNotificationSeen ? { 'background-color': '#E3F2FD' } : {}"
                        >
                          <v-list-item-content class="text-left">
                            <v-list-item-title>
                              {{ notification.title || 'Notification' }}
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-wrap">
                              {{ notification.body || notification.message || 'No message' }}
                            </v-list-item-subtitle>
                            <v-list-item-subtitle class="text-caption mt-1">
                              {{ formatDate(notification.createdAt || notification.timestamp) }}
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                        <v-divider
                          v-if="index < notifications.length - 1"
                          :key="'divider-' + index"
                        ></v-divider>
                      </template>
                    </v-list>
                    <div v-if="isLoadingMoreNotifications" class="text-center pa-2">
                      <v-progress-circular 
                        indeterminate 
                        color="primary" 
                        size="20"
                      ></v-progress-circular>
                      <span class="ml-2 text-caption">Loading more...</span>
                    </div>
                    <div v-else-if="notifications.length > 0 && !hasMoreNotifications" class="text-center pa-2">
                      <span class="text-caption grey--text">No more notifications</span>
                    </div>
                  </div>
                  <v-card-text v-if="notifications.length === 0 && !isLoadingMoreNotifications" class="text-center pa-4">
                    <v-icon large color="grey lighten-1">mdi-bell-off-outline</v-icon>
                    <p class="mt-2 grey--text">No notifications</p>
                  </v-card-text>
                </v-card>
              </v-menu>
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-app-bar>

    <v-navigation-drawer
      v-model="sideNav"
      fixed
      temporary
      class="hidden-lg-and-up"
      color="#152E4F"
      right
    >
      <v-layout wrap justify-center>
        <!-- Navigation Items -->
        <v-flex
          xs12
          v-for="(item, i) in navItems"
          :key="i"
          text-center
          pa-2
          pl-4
          text-uppercase
          align-self-center
          link
        >
          <div v-if="item.name === 'Tax Credits'" style="text-align: left">
            <v-btn
              text
              block
              style="color: white; font-family: opensansregular"
              @click="toggleTaxCreditsDropdown"
            >
              {{ item.name }}
              <v-icon color="white" class="ml-2">
                {{ taxCreditsOpen ? "mdi-chevron-up" : "mdi-chevron-down" }}
              </v-icon>
            </v-btn>
            <v-expand-transition>
              <v-list v-if="taxCreditsOpen" dense class="dropdown-list">
                <v-list-item
                  v-for="(subItem, index) in taxcreditdata"
                  :key="index"
                  @click="navigateToTaxCredit(subItem.id)"
                  style="cursor: pointer; padding-left: 20px"
                >
                  <v-list-item-title style="color: white; font-size: 14px">
                    {{ subItem.name }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-expand-transition>
            <v-divider color="#fff"></v-divider>
          </div>

          <div v-else>
            <router-link :to="item.route">
              <v-layout wrap justify-center>
                <v-flex xs12>
                  <span
                    style="
                      font-family: poppinslight;
                      font-size: 15px;
                      color: #ffffff;
                      letter-spacing: 2px;
                    "
                    >{{ item.name }}</span
                  >
                </v-flex>
                <v-flex xs12 pt-2>
                  <v-divider color="#fff"></v-divider>
                </v-flex>
              </v-layout>
            </router-link>
          </div>
        </v-flex>

        <!-- Profile Button -->
        <v-flex xs12 pa-2 text-center pl-4 v-if="appLogin">
          <v-btn color="#003D29" text to="/profile">
            <span style="color: white; font-family: opensansregular"
              >PROFILE</span
            >
          </v-btn>
          <v-divider color="#fff"></v-divider>
        </v-flex>

        <!-- Application Button -->
        <v-flex xs12 pa-2 text-center pl-4 v-if="appLogin">
          <v-btn color="#003D29" text to="/application">
            <span style="color: white; font-family: opensansregular"
              >Application</span
            >
          </v-btn>
          <v-divider color="#fff"></v-divider>
        </v-flex>

        <!-- Login Button -->
        <v-flex xs12 pa-2 text-center pl-4 v-if="!appLogin">
          <v-btn color="#003D29" text to="/login">
            <span style="color: white; font-family: opensansregular"
              >LOGIN</span
            >
          </v-btn>
          <v-divider color="#fff"></v-divider>
        </v-flex>

        <v-flex xs12 pa-2 text-center pl-4 v-if="!appLogin">
          <v-btn color="#003D29" text to="/apply-now">
            <span style="color: white; font-family: opensansregular"
              >Apply Now</span
            >
          </v-btn>
          <v-divider color="#fff"></v-divider>
        </v-flex>

        <!-- Logout Button -->
        <v-flex xs12 pa-2 text-center pl-4 v-if="appLogin">
          <v-btn color="#003D29" text @click="handleLogout">
            <span style="color: white; font-family: opensansregular"
              >Logout</span
            >
          </v-btn>
        </v-flex>
      </v-layout>
    </v-navigation-drawer>
  </div>
</template>
  <script>
import { ApiMigrationMixin } from "@/utils/apiMigration";

//   import Notification from "./notification";
//import AccountMenu from "./accountMenu";
import AppHeader0 from "./AppHeader0";
// import AppHeaderBanner from "./AppHeaderBanner";
export default {
  mixins: [ApiMigrationMixin],
  components: {
    AppHeader0,
  },
  data() {
    return {
      navDrawer: false,
      transAppBar: true,
      searchKey: null,
      taxCreditsOpen: false,
      sideNav: false,
      taxcreditdata: [],
      notifications: [],
      unreadNotificationCount: 0,
      notificationMenuOpen: false,
      notificationMenuOpenDesktop: false,
      currentNotificationPage: 1,
      notificationPageSize: 5,
      isLoadingMoreNotifications: false,
      hasMoreNotifications: true,
      totalNotifications: 0,
      // notification: {},
      subItems: [
        { name: "Sub-item 1" },
        { name: "Sub-item 2" },
        { name: "Sub-item 3" },
      ],
      navItems1: [
        { label: "Home", route: "/" },
        { label: "Tax Credits ", route: "/contactUs" },
        { label: "FAQs", route: "/faqs" },
        { label: "Blogs", route: "/blogs" },
        { label: "About Us", route: "/about-us" },
        { label: "Contact Us", route: "/contact-us" },
      ],

      navItems: [
        { name: "HOME", route: "/", type: "link" },
        { name: "Tax Credits", route: "/contactUs", type: "link" },
        { name: "FAQs", route: "/faqs", type: "link" },
        { name: "Blogs", route: "/blogs", type: "link" },
        { name: "About Us", route: "/about-us" },
        { name: "Contact Us", route: "/contact-us", type: "link" },
      ],
      profileData: {},
    };
  },

  computed: {
    appUser() {
      return this.$store.state.userName;
    },
    appLogin() {
      return this.$store.state.isLoggedIn;
    },
  },
  mounted() {
    this.getData();
    if (this.appLogin) {
      this.fetchNotifications();
      this.setupNotificationListeners();
    }
  },
  watch: {
    appLogin(newVal, oldVal) {
      if (newVal && !oldVal) {
        this.fetchNotifications();
        this.setupNotificationListeners();
      }
      if (!newVal && oldVal) {
        this.removeNotificationListeners();
        this.notifications = [];
        this.unreadNotificationCount = 0;
      }
    }
    ,
    // When the notification menu closes, mark notifications as seen on server
    notificationMenuOpenDesktop(newVal, oldVal) {
      if (oldVal && !newVal) {
        this.markNotificationsSeen();
      }
    },
    notificationMenuOpen(newVal, oldVal) {
      if (oldVal && !newVal) {
        this.markNotificationsSeen();
      }
    }
  },
  beforeMount() {
    this.getProfile();
  },
  beforeDestroy() {
    this.removeNotificationListeners();
  },
  methods: {
    async fetchNotifications(page = 1, append = false) {
      const token =
        localStorage.getItem("accesstoken") || localStorage.getItem("token");
      if (!token) {
        return;
      }

      try {
        if (!append) {
          this.currentNotificationPage = 1;
          this.hasMoreNotifications = true;
        }
        
        const response = await this.fetchData("notifications/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: parseInt(page, 10),
            size: parseInt(this.notificationPageSize, 10)
          }
        });
        
        const newNotifications = response.data || [];
        const metadata = response.metadata || {};
        
        if (append) {
          this.notifications = [...this.notifications, ...newNotifications];
        } else {
          this.notifications = newNotifications;
        }

        this.totalNotifications = metadata.total || 0;
        const currentPage = metadata.page || page;
        const pageSize = metadata.size || this.notificationPageSize;

        const totalPages = Math.ceil(this.totalNotifications / pageSize);
        this.hasMoreNotifications = currentPage < totalPages;

        // unread count = number of notifications where isNotificationSeen is false
        this.unreadNotificationCount = Array.isArray(this.notifications)
          ? this.notifications.filter((n) => !n.isNotificationSeen).length
          : 0;
      } catch (err) {
        console.error("Error fetching notifications:", err);
        if (!append) {
          this.notifications = [];
          this.unreadNotificationCount = 0;
          this.totalNotifications = 0;
        }
      }
    },
    async loadMoreNotifications() {
      if (this.isLoadingMoreNotifications || !this.hasMoreNotifications) {
        return;
      }
      
      this.isLoadingMoreNotifications = true;
      this.currentNotificationPage += 1;
      
      try {
        await this.fetchNotifications(this.currentNotificationPage, true);
      } catch (err) {
        console.error("Error loading more notifications:", err);
        this.currentNotificationPage -= 1; // Revert page increment on error
      } finally {
        this.isLoadingMoreNotifications = false;
      }
    },
    async markNotificationsSeen() {
      const token = localStorage.getItem("accesstoken") || localStorage.getItem("token");
      if (!token) return;

      try {
        await this.fetchData("notifications/user/seen", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // locally mark notifications as seen
        this.unreadNotificationCount = 0;
        this.notifications = this.notifications.map((n) => ({
          ...n,
          isNotificationSeen: true,
        }));
      } catch (err) {
        console.error("Error marking notifications as seen:", err);
      }
    },
    onNotificationScroll(event) {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      
      if (isAtBottom && this.hasMoreNotifications && !this.isLoadingMoreNotifications) {
        this.loadMoreNotifications();
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
      } catch (e) {
        return dateString;
      }
    },
    redirectToLocalSite() {
      window.open("https://org.ecoraise.org.in", "_blank");
    },
    navigateToTaxCredit(taxCredit) {
      this.$router.push("/tax-details/" + taxCredit);
    },

    //   appSearch() {
    //     if (this.$route.query.searchKey == this.searchKey) return;
    //     this.$router.push({
    //       path: "/PlanYourVisit",
    //       query: {
    //         searchKey: this.searchKey,
    //       },
    //     });
    //   },

    async handleLogout() {
      const fcmToken = localStorage.getItem('fcmToken');
      const accessToken = localStorage.getItem('accesstoken') || localStorage.getItem('token');
      if (fcmToken && accessToken) {
        try {
          await this.$api.delete('/notifications/user/fcm-token', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            data: { fcmToken }
          });
        } catch (err) {
          console.error('Failed to remove FCM token:', err);
        }
      }
      this.$store.dispatch('sessionOut');
    },
    toggleTaxCreditsDropdown() {
      this.taxCreditsOpen = !this.taxCreditsOpen;
    },
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/site-contents/tax-credits", {
          params: {
            page: 1,
            size: 50,
          },
        });
        this.appLoading = false;
        this.taxcreditdata = response.data;
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 500) {
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            this.ServerError = false;
            this.msg = err.response?.data?.message || "";
          }
        } else {
          this.ServerError = true;
          this.msg = "An unexpected error occurred. Please try again.";
        }
        this.$snackbar.showError(this.msg); 
      }
    },
    async getProfile() {
      const token =
        localStorage.getItem("accesstoken") || localStorage.getItem("token");
      if (!token) {
        return;
      }

      try {
        this.appLoading = true;
        const response = await this.fetchData("/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        this.appLoading = false;
        this.profileData = response.data;
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 500) {
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            this.ServerError = false;
            this.msg = err.response?.data?.message || "";
          }
        } else {
          this.ServerError = true;
          this.msg = "An unexpected error occurred. Please try again.";
        }
        this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
      }
    },

    goHome() {
      this.$router.push({ path: "/" });
    },

    onScroll(e) {
      this.offsetTop = e.target.scrollTop;
      if (typeof window === "undefined") return;
      const top = window.pageYOffset || e.target.scrollTop || 0;

      if (top > 2) {
        this.transAppBar = false;
      } else {
        this.transAppBar = true;
      }
    },
    setupNotificationListeners() {
      if (!this.appLogin) {
        return;
      }
      
      // existing app-level event from other parts of the app
      window.addEventListener('fcm-message-received', this.handleFCMMessage);

      // Also listen for messages posted from the Service Worker (push notifications)
      try {
        if (navigator && navigator.serviceWorker && typeof navigator.serviceWorker.addEventListener === 'function') {
          navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
        }
      } catch (e) {
        // ignore if navigator or serviceWorker is not available
        console.warn('ServiceWorker message listener not attached', e);
      }
    },
    removeNotificationListeners() {
      window.removeEventListener('fcm-message-received', this.handleFCMMessage);
      try {
        if (navigator && navigator.serviceWorker && typeof navigator.serviceWorker.removeEventListener === 'function') {
          navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
        }
      } catch (e) {
        console.warn('ServiceWorker message listener not removed', e);
      }
    },
    handleServiceWorkerMessage(event) {
      // event.data is typically the payload sent from the service worker via postMessage
      try {
        const data = event && event.data;
        if (!data) return;

        // Accept common shapes from SW: { type: 'PUSH_NOTIFICATION', ... } or { notification: {...} }
        const type = data.type || (data.notification && data.notification.type) || '';

        // Trigger notifications listing refresh when a push/notification message arrives
        if (typeof type === 'string' && (type.toLowerCase().includes('push') || type.toLowerCase().includes('notification'))) {
          this.fetchNotifications();
        } else if (data && (data.title || data.body || data.message)) {
          // fallback: if data looks like a notification payload, refresh
          this.fetchNotifications();
        }
      } catch (err) {
        console.error('Error handling service worker message', err);
      }
    },
    handleFCMMessage() {
      console.log('[AppHeader] FCM message received, refreshing notifications...');
      
      if (this.appLogin) {
        this.fetchNotifications();
      }
    },
    removeNotification(index) {
      this.notifications.splice(index, 1);
      this.unreadNotificationCount = this.notifications.filter(
        (n) => !n.read && !n.isRead
      ).length;
    },
  },
};
</script>

  <style scoped>
.black-divider {
  border-color: black; /* Set the divider color to black */
}
.v-toolbar__content {
  padding: 0px !important;
}
.custom .v-select__slot {
  font-family: opensansregular; /* Replace with your preferred font-family */
  font-size: 14px; /* Replace with your preferred font-size */
}
.black-divider {
  border-color: black; /* Set divider color */
  height: 24px; /* Adjust height for alignment */
}
.mx-3 {
  margin-left: 12px !important;
  margin-right: 12px !important; /* Equal spacing */
}
.separator {
  text-align: center;
  margin: 0px 0;
  font-weight: bold;
  font-size: 0.9rem;
  color: #666;
}
.nav-link {
  color: inherit;
  font-size: 16px;
  font-family: DMSans;
  font-family: 400;
  text-transform: uppercase;
  font-size: 16;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #1a73e9; /* Orange color on hover */
}

.active-link {
  color: #1a73e9; /* Orange color for active link */
  font-weight: bold; /* Optional: make the active link bold */
}

.headeritems {
  font-family: DMSans;
  font-family: 400;
  font-size: 16;
}
.nav-linkk {
  font-size: 16px;
  font-weight: bold;
}

.dropdown-card {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%; /* Adjust width to cover the desired space */
  max-width: 1200px; /* Increase the maximum width as needed */
  border-radius: 4px;
  background-color: #1a73e9; /* Ensure the dropdown background matches the rest */
  z-index: 100;
}

.scrollable-content {
  max-height: 300px; /* Adjust height as needed */
  overflow-y: auto; /* Enable vertical scrolling */
}

/* Custom scrollbar styling */
.scrollable-content::-webkit-scrollbar {
  width: 8px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: #ffffff;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: white;
  border-radius: 4px;
}
</style>

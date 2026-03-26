<template>
  <div>
    <v-app-bar
      color="white"
      elevation="3"
      dark
      class="hidden-sm-and-down"
      height="80px"
    >
      <v-layout wrap justify-space-between hidden-xs-only fill-height>
        <v-flex sm2 md2 lg2 align-self-center pr-lg-1 pr-xl-12>
          <v-layout wrap justify-start>
            <v-flex text-left pt-2>
              <v-img
                src="./../../assets/icons/greenphone.png"
                height="25px"
                contain
              />
            </v-flex>
            <v-flex text-left>
              <span
                style="
                  font-family: RobotoRegular;
                  color: black;
                  font-size: 13px;
                "
                >Call Us</span
              >
              <br />
              <span
                style="
                  font-family: RobotoRegular;
                  color: black;
                  font-size: 13px;
                "
                >+91 {{ appSeller.contactNumber }}</span
              >
            </v-flex>
          </v-layout>
        </v-flex>
        <v-flex sm5 md5 lg8 xl8 text-center align-self-center pt-3>
          <router-link to="/">
            <!-- <v-img
              contain
              height="50px"
              src="./../../assets/greenlogo.png"
            ></v-img> -->
            <span
              style="
                font-family: opensansbold;
                text-transform: uppercase;
                color: #30b868;
                font-size: 25px;
              "
              >{{ appSeller.shopName }}</span
            >
          </router-link>
        </v-flex>
        <v-spacer></v-spacer>
        <v-flex sm5 md3 lg2 xl1 pr-5 text-right align-self-center>
          <v-layout wrap justify-end>
            <v-flex pt-1 text-right>
              <AccountMenuEco />
              <!-- <router-link to="/profile">
                <v-img
                  src="./../../assets/icons/blackuser.png"
                  height="25px"
                  contain
                />
              </router-link> -->
            </v-flex>
            <v-flex pt-1 text-center>
              <v-btn block text rounded :ripple="false" to="/wishlist">
                <!-- #53a874 -->
                <v-badge
                  color="#FF7C03"
                  right
                  small
                  :content="appWishlist ? appWishlist : '0'"
                  overlap
                  offset-x="10"
                >
                  <v-icon color="black">mdi-heart-outline</v-icon>
                </v-badge>
              </v-btn>
            </v-flex>
            <v-flex pt-1 text-left>
              <v-btn block text rounded :ripple="false" to="/cart">
                <v-badge
                  color="#FF7C03"
                  right
                  :content="appCart ? appCart : '0'"
                  small
                  overlap
                  offset-x="10"
                >
                  <v-img
                    src="./../../assets/icons/blackcart.png"
                    height="25px"
                    contain
                  />
                </v-badge>
              </v-btn>
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
      height="60px"
      class="hidden-lg-and-up"
    >
      <v-app-bar-nav-icon @click.native="sideNav = !sideNav">
        <v-icon class="pl-3" color="#30B868">mdi-menu</v-icon>
      </v-app-bar-nav-icon>
      <v-layout wrap justify-center>
        <v-flex xs6>
          <v-layout wrap>
            <v-flex xs2 text-left pt-2>
              <v-img
                src="./../../assets/icons/greenphone.png"
                height="25px"
                contain
              />
            </v-flex>
            <v-flex text-left>
              <span
                style="
                  font-family: RobotoRegular;
                  color: black;
                  font-size: 13px;
                "
                >Call Us</span
              >
              <br />
              <span
                style="
                  font-family: RobotoRegular;
                  color: black;
                  font-size: 13px;
                "
                >+91 8396568429</span
              >
            </v-flex>
          </v-layout>
        </v-flex>
        <v-flex xs3 sm4 md7 text-center>
          <router-link to="/">
            <v-img
              contain
              height="50px"
              src="./../../assets/greenlogo.png"
            ></v-img>
          </router-link>
        </v-flex>
      </v-layout>
    </v-app-bar>
    <v-navigation-drawer
      v-model="sideNav"
      fixed
      temporary
      class="hidden-lg-and-up"
      color="#202020"
      right
    >
      <v-layout wrap justify-center>
        <v-flex
          xs12
          v-for="(item, i) in items"
          :key="i"
          text-center
          pa-2
          pl-4
          text-uppercase
          align-self-center
          link
        >
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
        </v-flex>
      </v-layout>
    </v-navigation-drawer>
  </div>
</template>
    <script>
//   import Notification from "./notification";
import AccountMenuEco from "./accountMenuEco";
export default {
  components: {
    //   Notification,
    AccountMenuEco,
  },
  data() {
    return {
      navDrawer: false,
      transAppBar: true,
      searchKey: null,
      sideNav: false,
      // notification: {},
      items: [
        { name: "HOME", route: "/ecoShop", type: "link" },
        { name: "profile", route: "/profile", type: "link" },
        // { name: "ROOM TARIF", route: "/accommadation", type: "link" },
        { name: "wishlist ", route: "/wishlist", type: "link" },
        { name: "Cart", route: "/cart", type: "link" },
      ],
    };
  },

  computed: {
    appUser() {
      return this.$store.state.userData;
    },
    appLogin() {
      return this.$store.state.isLoggedIn;
    },
    appType() {
      return this.$store.state.userType;
    },
    appSeller() {
      return this.$store.state.sellerData;
    },
    appCartType() {
      return this.$store.state.cartType;
    },
    appCart() {
      if (this.$store.state.cartCount == undefined) {
        return 0;
      } else {
        return this.$store.state.cartCount;
      }
    },
    appWishlist() {
      if (this.$store.state.wishListCount == undefined) {
        return 0;
      } else {
        return this.$store.state.wishListCount;
      }
    },
  },
  // beforeMount() {
  //   this.searchKey = this.$route.query.searchKey;
  // },
  methods: {
    //   appSearch() {
    //     if (this.$route.query.searchKey == this.searchKey) return;
    //     this.$router.push({
    //       path: "/PlanYourVisit",
    //       query: {
    //         searchKey: this.searchKey,
    //       },
    //     });
    //   },
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
  },
};
</script>
    <style >
.v-toolbar__content {
  padding: 0px !important;
}
</style>
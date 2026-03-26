<template>
  <v-navigation-drawer
    v-model="Sidebar_drawer"
    :dark="SidebarColor !== '#085AC6'"
    :color="SidebarColor"
    mobile-break-point="960"
    clipped
    right
    
    mini-variant-width="58"
    app
    id="main-sidebar"
    mini-variant

    permanent
  >
    <v-list v-if="userRole == 'admin'" dense nav>
      <!---USer Area -->
      <!-- <v-list-item two-line class="px-0">
        <v-list-item-avatar>
          <img src="https://randomuser.me/api/portraits/men/81.jpg" />
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>Dohn Deo</v-list-item-title>
          <v-list-item-subtitle class="caption">Webdesigner</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item> -->
      <!---USer Area -->
      <!---Sidebar Items -->
      <v-list-item
        
        v-for="item in adminitems"
        :key="item.title"
        :to="item.to"
        :active-class="`success white--text`"
        link
      >
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <!---Sidebar Items -->
    </v-list>

    <v-list v-if="userRole == 'employee'" dense nav>
     
      <v-list-item
        
        v-for="item in employeeitems"
        :key="item.title"
        :to="item.to"
        :active-class="`success white--text`"
        link
      >
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <!---Sidebar Items -->
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Sidebar",
  props: {
    expandOnHover: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    userRole: localStorage.getItem("role"),
    adminitems: [
      {
        title: "Dashboard",
        icon: "mdi-view-dashboard",
        to: "/dashboard"
      },
      {
        title: "Users",
        icon: "mdi-account -circle",
        to: "/Employee"
      },
      //  {
      //   title: "Add Employee",
      //   icon: "mdi-account -circle",
      //   to: "/addEmployee"
      // }, 
      
      {
        title: "Bussiness Verification",
        icon: "mdi-account-multiple",
        to: "/customers"
      },

    // {
    //     title: "Add Customer",
    //     icon: "mdi-account -circle",
    //     to: "/addCustomer"
    //   }, 
      
      {
        title: "Orders",
        icon: "mdi-book-open",
        to: "/Orders"
      },
      // {
      //   title: "Add Order",
      //   icon: "mdi-file-plus",
      //   to: "/addOrder"
      // }, 

      {
        title: "Invoice",
        icon: "mdi-file-document",
        to: "/Invoices"
      },
      // {
      //   title: "Add Invoice",
      //   icon: "mdi-file-plus",
      //   to: "/addInvoice"
      // },
      // {
      //   title: "Profile",
      //   icon: "mdi-account-circle",
      //   to: "/pages/profile"
      // },

      // {
      //   title: "Alerts",
      //   icon: "mdi-alert",
      //   to: "/pages/alerts"
      // },

      // {
      //   title: "Icons",
      //   icon: "mdi-emoticon",
      //   to: "/pages/icons"
      // },

      // {
      //   title: "Basic Table",
      //   icon: "mdi-table-column-width",
      //   to: "/pages/tables-simple"
      // }
    ],
    employeeitems: [
      {
        title: "Dashboard",
        icon: "mdi-view-dashboard",
        to: "/dashboard"
      },
      // {
      //   title: "Employee",
      //   icon: "mdi-account -circle",
      //   to: "/Employee"
      // },
      //  {
      //   title: "Add Employee",
      //   icon: "mdi-account -circle",
      //   to: "/addEmployee"
      // }, 
      
      {
        title: "Customers",
        icon: "mdi-account-multiple",
        to: "/customers"
      },

    {
        title: "Add Customer",
        icon: "mdi-account -circle",
        to: "/addCustomer"
      }, 
      
      {
        title: "Orders",
        icon: "mdi-book-open",
        to: "/Orders"
      },
      {
        title: "Add Order",
        icon: "mdi-file-plus",
        to: "/addOrder"
      }, 
      {
        title: "Invoice",
        icon: "mdi-file-document",
        to: "/Invoices"
      },
      {
        title: "Add Invoice",
        icon: "mdi-file-plus",
        to: "/addInvoice"
      },
      {
        title: "Profile",
        icon: "mdi-account-circle",
        to: "/pages/profile"
      },

      
    ],
  }),
  computed: {
    ...mapState(["SidebarColor", "SidebarBg"]),
    Sidebar_drawer: {
      get() {
        return this.$store.state.Sidebar_drawer;
      },
      set(val) {
        this.$store.commit("SET_SIDEBAR_DRAWER", val);
      }
    }
  },
  watch: {
    "$vuetify.breakpoint.smAndDown"(val) {
      this.$emit("update:expandOnHover", !val);
    }
  },

  methods: {}
};
</script>
<style lang="scss">
#main-sidebar{
  box-shadow:1px 0 20px rgba(0,0,0,.08);
  -webkit-box-shadow:1px 0 20px rgba(0,0,0,.08);
  .v-navigation-drawer__border{
    display: none;
  }
  .v-list{
    padding: 8px 15px;
  }
  .v-list-item{
      &__icon--text,
      &__icon:first-child{
        justify-content: center;
        text-align: center;
        width: 20px;
        
      }
      
  }  
   .success {
    background-color: #1e88e5!important;
    border-color: #1e88e5!important;
}  
}
</style>
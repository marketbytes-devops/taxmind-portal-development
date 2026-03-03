import Vue from "vue";
import Router from "vue-router";
import store from "@/store";
import permissionService from "@/utils/permissions";
Vue.use(Router);
const router = new Router({
  // base: process.env.BASE_URL,
  routes: [
    {
      path: "/Login",
      name: "Login",
      component: () => import("./components/Auth/login"),
      meta: { requiresAuth: false },
    },
    {
      path: "*",
      name: "404pagenotfound",
      props: true,
      component: () => import("./components/Common/404"),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/servererror",
      name: "servererror",
      props: true,
      component: () => import("./components/Common/500"),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/",
      redirect: "dashboard",
      name: "AdminDashboard",
      component: () => import("@/layouts/Layout"),
      meta: { requiresAuth: true },
      children: [
        {
          name: "Dashboard",
          path: "dashboard",
          component: () =>
            import("./components/Views/Dashboard/basicDashboard"),
        },
        {
          name: "aboutUs",
          path: "aboutUs",
          component: () => import("./components/Views/Content_editor/aboutUs"),
        },
        {
          name: "contactUs",
          path: "contactUs",
          component: () => import("./components/Views/contactUs/contactUs"),
        },
        {
          name: "faqs",
          path: "faqs",
          component: () => import("./components/Views/FAQs/faqs"),
        },
        {
          name: "carousel_Img",
          path: "carousel_Img",
          component: () =>
            import("./components/Views/Carousel_Img/carousel_Img"),
        },
        {
          name: "blogs",
          path: "blogs",
          component: () => import("./components/Views/Blogs/blog"),
        },
        {
          name: "tax_credits",
          path: "tax_credits",
          component: () => import("./components/Views/TaxCredits/taxCredits"),
        },
        {
          name: "edit_tax_credits",
          path: "edit_tax_credits",
          component: () =>
            import("./components/Views/TaxCredits/edittaxCredits"),
        },
        {
          name: "user_view",
          path: "user_view",
          component: () => import("./components/Views/UsersPage/userView.vue"),
        },
        {
          name: "Privacy_Policy",
          path: "Privacy_Policy",
          component: () => import("./components/Views/Policy/privacyPolicy"),
        },
        {
          name: "Fee_Structure",
          path: "Fee_Structure",
          component: () =>
            import("./components/Views/FeeStructure/feeStructure"),
        },
        {
          name: "Cookies_Policy",
          path: "Cookies_Policy",
          component: () =>
            import("./components/Views/CookiesPolicy/cookiesPolicy"),
        },
        {
          name: "users-list",
          path: "users-list",
          component: () => import("./components/Views/UsersPage/usersList"),
        },
        {
          name: "application-list",
          path: "application-list",
          component: () =>
            import("./components/Views/Applications/applications"),
        },

        {
          name: "review-list",
          path: "review-list",
          component: () => import("./components/Views/Reviews/review"),
        },
        {
          name: "review-view",
          path: "review-view",
          component: () => import("./components/Views/Reviews/reviewView"),
        },
        {
          name: "document-templates",
          path: "document-templates",
          component: () =>
            import("./components/Views/DocumentTemplates/template"),
        },
        {
          name: "commission",
          path: "commission",
          component: () => import("./components/Views/Commission/commission"),
        },
        {
          name: "application-view",
          path: "application-view",
          component: () =>
            import("./components/Views/Applications/applicationView"),
        },
        {
          name: "agent-activation",
          path: "agent-activation",
          component: () =>
            import("./components/Views/Agent Activation/AgentActivationView"),
        },
        {
          name: "upload-csv",
          path: "upload-csv",
          component: () =>
            import("./components/Views/Agent Activation/uploadCSV"),
        },
        {
          name: "questionnaire",
          path: "questionnaire",
          component: () =>
            import("./components/Views/Questionnaire/questionnaire"),
        },
        {
          name: "roleAndAccesss",
          path: "roleAndAccesss",
          component: () =>
            import("./components/Views/RoleAndAccesss/roleAndAccesss"),
        },
        {
          name: "createQuestionaire",
          path: "createQuestionaire/:id",
          component: () =>
            import("./components/Views/Questionnaire/createQuestionaire"),
        },
        {
          name: "viewQuestionnaire",
          path: "viewQuestionnaire/:id",
          component: () =>
            import("./components/Views/Questionnaire/createQuestionaire"),
          props: { mode: "view" },
        },
        {
          name: "Payments",
          path: "Payments",
          component: () => import("./components/Views/Payments/payments.vue"),
        },
        {
          name: "Offboardusers",
          path: "Offboardusers",
          component: () =>
            import("./components/Views/Offboardusers/offboardusers.vue"),
        },
        {
          name: "terms-conditions",
          path: "terms-conditions",
          component: () =>
            import("./components/Views/Terms&Conditions/termsandCondition"),
        },
        {
          name: "top-header",
          path: "top-header",
          component: () => import("./components/Views/TopHeader/topHeader"),
        },
        {
          name: "customer-support",
          path: "customer-support",
          component: () =>
            import("./components/Views/CustomerSupport/customersprt"),
        },
        {
          name: "Category_Section",
          path: "Category_Section",
          component: () =>
            import("./components/Views/Category/categorySection"),
        },
      ],
    },
    {
      name: "comments",
      path: "/comments/:id",
      component: () =>
        import("./components/Views/Applications/applicationComments"),
    },
  ],
  scrollBehavior() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0;
  },
});

router.beforeEach((to, from, next) => {
  const leavingUsersPage = ["users-list", "user_view"].includes(from.name);
  const notEnteringUsersPage = !["users-list", "user_view"].includes(to.name);
  if (leavingUsersPage && notEnteringUsersPage) {
    store.commit("changeUsersCurrentPage", "");
  }
  const leavingApplicationsPage = [
    "application-list",
    "application-view",
  ].includes(from.name);
  const notEnteringApplicationsPage = ![
    "application-list",
    "application-view",
  ].includes(to.name);
  if (leavingApplicationsPage && notEnteringApplicationsPage) {
    store.commit("changeApplicationsCurrentPage", "");
  }
  const leavingReviewsPage = ["review-list", "review-view"].includes(from.name);
  const notEnteringReviewsPage = !["review-list", "review-view"].includes(
    to.name
  );
  if (leavingReviewsPage && notEnteringReviewsPage) {
    store.commit("changeReviewsCurrentPage", "");
  }
  const leavingTaxcreditPage = ["tax_credits", "edit_tax_credits"].includes(
    from.name
  );
  const notEnteringTaxcreditPage = ![
    "tax_credits",
    "edit_tax_credits",
  ].includes(to.name);
  if (leavingTaxcreditPage && notEnteringTaxcreditPage) {
    store.commit("changeTaxcreditCurrentPage", "");
  }
  // Socket authentication will be handled by individual components that need it
  // Token validation will happen automatically via HTTP interceptor on 401 responses

 

  // Check authentication first
  if (
    to.matched.some((route) => route.meta.requiresAuth) &&
    !store.state.isLoggedIn
  ) {
   
    next({ name: "Login" });
    return;
  }

  if (to.name == "Login" && store.state.isLoggedIn == true) {
  
    next({ name: "AdminDashboard" });
    return;
  }

  // Check permissions for protected routes
  if (store.state.isLoggedIn && to.path && to.path !== "/dashboard") {
    const hasAccess = permissionService.canAccessRoute(to.path);

    if (!hasAccess) {
      // Redirect to dashboard or show 403 page
      next({ name: "Dashboard" });
      return;
    }
  }

  next();
});

export default router;

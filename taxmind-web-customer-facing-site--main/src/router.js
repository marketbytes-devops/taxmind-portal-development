import Vue from "vue";
import Router from "vue-router";
import store from "./store";
import axios from "axios";
// import Socket from "@/Sockets/socket.js";

// Configure axios for router usage (avoiding circular dependency)
axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL;
axios.defaults.timeout = parseInt(process.env.VUE_APP_API_TIMEOUT) || 30000;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

Vue.use(Router);
let router = new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      props: true,
      name: "Home",
      component: () =>
        import(
          /* webpackChunkName: "HomePage" */ "./components/LandingPage/homePage.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/login",
      name: "login",
      component: () =>
        import(
          /* webpackChunkName: "LoginPage" */ "./components/ApplyNow/loginPage.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/apply-now",
      name: "apply-now",
      component: () =>
        import(
          /* webpackChunkName: "ApplyNow" */ "./components/ApplyNow/applyNow.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/faqs",
      props: true,
      name: "faqs",
      component: () =>
        import(/* webpackChunkName: "FAQs" */ "./components/FAQs/faqs.vue"),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/otp-verify",
      props: true,
      name: "otp-verify",
      component: () =>
        import(
          /* webpackChunkName: "OTPPage" */ "./components/ApplyNow/otpPage.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/create-password",
      props: true,
      name: "create-password",
      component: () =>
        import(
          /* webpackChunkName: "CreatePassword" */ "./components/ApplyNow/createPassword.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/about-us",
      props: true,
      name: "about-us",
      component: () =>
        import(
          /* webpackChunkName: "AboutUs" */ "./components/About/AboutUs.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/privacy-policy",
      props: true,
      name: "Privacy_Policy",
      component: () =>
        import(
          /* webpackChunkName: "PrivacyPolicy" */ "./components/PrivacyPolicy/privacyPolicy.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/tax-details/:id",
      props: true,
      name: "tax-detailed",
      component: () =>
        import(
          /* webpackChunkName: "TaxDetailedPage" */ "./components/TaxDetailed/detailedPage.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/cookies-policy",
      props: true,
      name: "cookies-policy",
      component: () =>
        import(
          /* webpackChunkName: "CookiesPolicy" */ "./components/CookiesPolicy/cookiesPolicy.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/fee-structure",
      props: true,
      name: "fee-structure",
      component: () =>
        import(
          /* webpackChunkName: "FeeStructure" */ "./components/FeeStructure/feeStructure.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/terms-and-conditions",
      props: true,
      name: "terms-and-conditions",
      component: () =>
        import(
          /* webpackChunkName: "TermsAndConditions" */ "./components/T&C/termsandConditions.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },

    {
      path: "/contact-us",
      props: true,
      name: "contact-us",
      component: () =>
        import(
          /* webpackChunkName: "ContactUs" */ "./components/contactUs/contactUs.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/blogs",
      props: true,
      name: "blogs",
      component: () =>
        import(
          /* webpackChunkName: "Blogs" */ "./components/Blogs/blogPage.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/blogs/:slug",
      props: true,
      name: "blog-detailed",
      component: () =>
        import(
          /* webpackChunkName: "BlogView" */ "./components/Blogs/blogView.vue"
        ),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/profile",
      meta: {
        label: "Profile",
        requiresAuth: true,
      },
      component: () =>
        import(
          /* webpackChunkName: "profile" */ "./components/Profile/ProfileView.vue"
        ),
      children: [
        {
          path: "",
          name: "Profile",
          meta: {
            label: "Profile",
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "profile" */ "./components/Profile/profilePage.vue"
            ),
        },
        {
          path: "/profile-details",
          name: "Profile Details",
          meta: {
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "profile" */ "./components/Profile/profileDetails.vue"
            ),
        },
        {
          path: "/profile-edit",
          name: "Profile Edit",
          meta: {
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "profile" */ "./components/Profile/profileEdit.vue"
            ),
        },
        // {
        //     path: '/templates',
        //     name: 'templates',
        //     meta: {
        //         requiresAuth: true,

        //     },
        //     component: () =>
        //         import(/* webpackChunkName: "profile" */'./components/Profile/DocumentTemplates.vue'),
        // },
        {
          path: "/change-password",
          name: "change password",
          meta: {
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "profile" */ "./components/Profile/changePassword.vue"
            ),
        },
        // {
        //     path: '/claim-history',
        //     name: 'Claim History',
        //     meta: {
        //         requiresAuth: true,

        //     },
        //     component: () =>
        //         import(/* webpackChunkName: "profile" */'./components/Profile/ClaimHistory.vue'),
        // },
        {
          path: "/customer-support",
          name: "customer support",
          meta: {
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "profile" */ "./components/Profile/CustomerSupport.vue"
            ),
        },
      ],
    },
    {
      path: "/application",
      meta: {
        label: "Application",
        requiresAuth: true,
      },
      component: () =>
        import(
          /* webpackChunkName: "application" */ "./components/Application/ApplicationView.vue"
        ),
      children: [
        {
          path: "",
          name: "Application",
          meta: {
            label: "Application",
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "application" */ "./components/Application/ApplicationPage.vue"
            ),
        },
        {
          path: "/application-history",
          name: "Claim History",
          meta: {
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "application" */ "./components/Application/ApplicationHistory.vue"
            ),
        },
        {
          path: "/application-templates",
          name: "Templates",
          meta: {
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "application" */ "./components/Application/ApplicationTemplates.vue"
            ),
        },
        {
          path: "/application-upload",
          name: "Application Menu",
          meta: {
            requiresAuth: true,
          },
          component: () =>
            import(
              /* webpackChunkName: "application" */ "./components/Application/components/ApplicationStepUploadContainer.vue"
            ),
        },
      ],
    },
    {
      path: "/questionnaire-preview",
      name: "QuestionnairePreview",
      meta: {
        requiresAuth: true,
      },
      component: () =>
        import(
          /* webpackChunkName: "application" */ "./components/Application/components/questionnaire/FullPageQuestionnaire.vue"
        ),
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      meta: {
        requiresAuth: false,
      },
      component: () =>
        import(
          /* webpackChunkName: "ForgotPassword" */ "./components/ApplyNow/forgotPassword.vue"
        ),
    },
    {
      path: "/signin-phone-verify",
      name: "signinPhoneVerify",
      meta: {
        requiresAuth: false,
      },
      component: () =>
        import(
          /* webpackChunkName: "SigninPhoneVerify" */ "./pages/Auth/signinPhoneVerify.vue"
        ),
    },
    {
      path: "/ServerError",
      name: "ServerError",
      props: true,
      component: () =>
        import(/* webpackChunkName: "ServerError" */ "./components/Common/500"),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "*",
      name: "404PageNotFound",
      props: true,
      component: () =>
        import(
          /* webpackChunkName: "PageNotFound" */ "./components/Common/404"
        ),
      meta: {
        requiresAuth: false,
      },
    },
  ],
  scrollBehavior() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0;
  },
});
router.beforeEach((to, from, next) => {
  // Prevent navigating back to authentication-related pages when already logged in
  const authRestrictedWhenLoggedIn = [
    "otp-verify",
    "forgotPassword",
    "create-password",
    "login",
    "signUp",
  ];
  const isLoggedIn =
    !!localStorage.getItem("accesstoken") || store.state.isLoggedIn;
  if (isLoggedIn && authRestrictedWhenLoggedIn.includes(to.name)) {
    // Allow OTP page for spouse verification even when logged in
    if (to.name === "otp-verify" && to.query.spouseOtpVerification === "true") {
      next();
      return;
    }
    // If user is already authenticated, redirect to application/dashboard
    next({ path: "/application" });
    return;
  }
  if (
    to.name !== "loginForm" &&
    to.name !== "signUp" &&
    to.name !== "forgotPassword" &&
    to.name !== "resetPassword"
  ) {
    localStorage.setItem("routeKey", to.fullPath);
  }

  // Check if route requires authentication
  if (to.matched.some((route) => route.meta.requiresAuth == true)) {
    const accessToken = localStorage.getItem("accesstoken");
    const refreshToken = localStorage.getItem("refreshtoken");

    // If no tokens, redirect to login
    if (!accessToken && !refreshToken) {
      localStorage.clear();
      store.dispatch("sessionOut");
      next({ name: "login" });
      return;
    }

    // Update store state based on token presence
    if (accessToken) {
      store.commit("SET_AUTH", {
        isLoggedIn: true,
        userId: localStorage.getItem("userId"),
        userRole: localStorage.getItem("userRole"),
        userName: localStorage.getItem("userName"),
      });
    }
  }

  // Prevent access to login page when already logged in
  if (to.name == "login" && store.state.isLoggedIn == true) {
    next({ name: "Home" });
    return;
  }

  next();
});

export default router;

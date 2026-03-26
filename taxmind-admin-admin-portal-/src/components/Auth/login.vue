<template>
  <div>
    <!-- <PageLoader />
      <ServerError v-if="ServerError" /> -->
    <v-app id="inspire">
      <v-layout wrap justify-center class="login_page">
        <v-flex xs12 sm6 md4 lg3 px-2 align-self-center>
          <v-layout wrap justify-center>
            <v-flex xs112 xl10>
              <!-- Snackbar -->
              <v-snackbar
                v-model="showSnackBar"
                color="#1A73E9"
                right
                :timeout="timeout"
              >
                <v-layout wrap justify-center>
                  <v-flex text-left class="align-self-center">
                    <span style="color: #fff">
                      {{ msg }}
                    </span>
                  </v-flex>
                  <v-flex text-right>
                    <v-btn
                      small
                      :ripple="false"
                      text
                      @click="showSnackBar = false"
                    >
                      <v-icon style="color: #fff">mdi-close</v-icon>
                    </v-btn>
                  </v-flex>
                </v-layout>
              </v-snackbar>
              <!-- Login Card -->
              <v-card tile flat>
                <v-layout wrap justify-center>
                  <v-flex px-8 py-6>
                    <v-layout wrap justify-center>
                      <v-flex xs12 text-center>
                        <span
                          style="
                            font-family: intermedium;
                            font-size: 15px;
                            color: #b8b8b8;
                          "
                        >
                          Welcome to
                        </span>
                      </v-flex>
                      <v-flex xs12 text-center py-4 style="cursor: pointer">
                        <span
                          style="
                            font-family: interbold;
                            font-size: 20px;
                            cursor: pointer;
                            color: #545454;
                          "
                        >
                          TaxMind
                        </span>
                      </v-flex>
                      <v-flex xs12>
                        <v-layout wrap justify-center>
                          <v-flex xs6 lg4 text-center px-2>
                            <span
                              style="
                                font-family: intersemibold;
                                font-size: 15px;
                                color: #000;
                              "
                            >
                              Log In
                            </span>
                            <v-progress-linear
                              height="2"
                              value="100"
                              color="black"
                            ></v-progress-linear>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                      <v-flex pt-8 xs12 text-left>
                        <v-layout wrap justify-center>
                          <v-flex xs12 pb-2>
                            <span
                              style="
                                font-family: interregular;
                                font-size: 14px;
                                color: #ababab;
                              "
                            >
                              Email
                            </span>
                          </v-flex>
                          <v-flex xs12>
                            <v-form @submit.prevent="validateInput">
                              <v-text-field
                                style="
                                  font-family: interregular;
                                  font-size: 13px;
                                  color: #ababab;
                                "
                                color="#717171"
                                placeholder="Email"
                                outlined
                                dense
                                v-model="email"
                                hide-details
                              ></v-text-field>
                            </v-form>
                          </v-flex>
                        </v-layout>

                        <v-layout wrap justify-center pt-2>
                          <v-flex xs12 pb-2>
                            <span
                              style="
                                font-family: interregular;
                                font-size: 14px;
                                color: #ababab;
                              "
                            >
                              Password
                            </span>
                          </v-flex>
                          <v-flex xs12>
                            <v-form @submit.prevent="validateInput">
                              <v-text-field
                                color="#717171"
                                style="
                                  font-family: interregular;
                                  font-size: 13px;
                                  color: #ababab;
                                "
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Password"
                                outlined
                                dense
                                v-model="password"
                                hide-details
                              >
                                <template v-slot:append>
                                  <v-icon
                                    @click="togglePasswordVisibility"
                                    class="password-icon"
                                  >
                                    {{
                                      showPassword ? "mdi-eye" : "mdi-eye-off"
                                    }}
                                  </v-icon>
                                </template>
                              </v-text-field>
                            </v-form>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                      <!-- <v-flex pt-2 xs12 text-left>
                          <router-link to="/forgotPassword">
                            <span
                              style="
                                font-family: intersemibold;
                                font-size: 12px;
                                text-transform: none;
                              "
                            >
                              Forgot Password ?
                            </span>
                          </router-link>
                        </v-flex> -->
                      <v-flex xs12 py-6>
                        <v-btn
                          block
                          tile
                          color="#085AC6"
                          dark
                          :ripple="false"
                          depressed
                          @click="validateInput"
                          class="itemValue"
                          style="font-family: intermedium; color: white"
                        >
                          Continue
                        </v-btn>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
              </v-card>
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>

      <!-- Footer -->

      <!-- <div class="footer pt-8 pb-2">
        <span>Designed and Developed by Leopard Tech Labs</span>
      </div> -->
    </v-app>
  </div>
</template>
  <script>
import store from "./../../store";
import { signIn } from "@/api/modules/auth";
import permissionService from "@/utils/permissions";
import { SIDEBAR_ITEMS } from "@/common/constants/sidebarItems";
import fcmService from "@/services/fcm";

export default {
  data() {
    return {
      ServerError: false,
      showSnackBar: false,
      timeout: 5000,
      msg: null,
      email: null,
      password: null,
      showPassword: false,
      appLoading: false,
    };
  },
  methods: {
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    validateInput() {
      if (!this.email) {
        this.msg = "Please Provide Email";
        this.showSnackBar = true;
        return;
      } else if (!this.password) {
        this.msg = "Please Provide Password";
        this.showSnackBar = true;
        return;
      } else {
        this.login();
      }
    },
    async login() {
      try {
        store.commit("appLoading", true);
        const res = await signIn({
          email: this.email,
          password: this.password,
        });

        // Handle response structure: { data: { accessToken, refreshToken, name, email, role } }
        // const status = res.success !== undefined ? res.success : true;
        const message = res.message || "Signed in successfully";
        const accessToken = res?.data?.accessToken || res?.accessToken;
        const role = res?.data?.role || res?.role;

        // Store role in localStorage for compatibility with existing code
        if (role) {
          localStorage.setItem("role", JSON.stringify(role));
        }

        // Update store with access token (tokens are already saved by signIn function)
        if (accessToken) {
          store.commit("loginUser", accessToken);
        }

        // TODO: Initialize socket authentication after successful login
        // Temporarily disabled to test redirect
        console.log("Socket authentication skipped for now");

        this.msg = message;
        this.showSnackBar = true;

        // Use $nextTick to ensure store state is updated before navigation
        this.$nextTick(async () => {
          console.log("Attempting navigation after login...");
          console.log("Store isLoggedIn state:", store.state.isLoggedIn);
          console.log("Token in localStorage:", localStorage.getItem("token"));
          
          // Register FCM token with backend after successful login
          let fcmToken = localStorage.getItem('fcmToken');
          console.log('[LOGIN] Checking FCM token in localStorage...');
          console.log('[LOGIN] FCM token found:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
          
          // If no FCM token in localStorage, try to get one
          if (!fcmToken) {
            console.log('[LOGIN] No FCM token found, attempting to get one...');
            try {
              fcmToken = await fcmService.getFCMToken();
              console.log('[LOGIN] FCM token obtained:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
            } catch (error) {
              console.error('[LOGIN] Error getting FCM token:', error);
            }
          }
          
          if (fcmToken) {
            console.log('[LOGIN] Dispatching registerFCMToken action...');
            try {
              await store.dispatch('notifications/registerFCMToken', fcmToken);
              console.log('[LOGIN] FCM token registration completed');
            } catch (error) {
              console.error('[LOGIN] Error registering FCM token:', error);
            }
          } else {
            console.log('[LOGIN] No FCM token available, skipping registration');
          }
          
          // Fetch initial notifications after login
          try {
            await store.dispatch('notifications/fetchNotifications', { page: 1, size: 20 });
          } catch (error) {
            console.error('Error fetching initial notifications:', error);
          }
          
          // Refresh permissions after login
          permissionService.refresh();
          
          // Get the first accessible route in sidebar order using shared constants
          const firstAccessibleRoute = permissionService.getFirstAccessibleRoute(SIDEBAR_ITEMS);
          
          if (firstAccessibleRoute) {
            console.log("Redirecting to first accessible route:", firstAccessibleRoute);
            this.$router.push(firstAccessibleRoute);
          } else {
            // No accessible modules, show error
            this.msg = "You don't have access to any modules. Please contact administrator.";
            this.showSnackBar = true;
            // Logout the user
            setTimeout(() => {
              localStorage.clear();
              store.commit("logoutUser");
              this.$router.push("/Login");
            }, 2000);
          }
        });
      } catch (err) {
        if (err.response) {
          this.ServerError = err.response.status === 500;
          this.msg = err.response.data?.message || "Authentication failed";
        } else {
          this.ServerError = true;
          this.msg = "Network error, please retry";
        }
        this.showSnackBar = true;
        console.error(err);
      } finally {
        store.commit("appLoading", false);
      }
    },
  },
};
</script>
  <style>
.login_page {
  background-color: #2aa86638;
  background-image: url("./../../assets/images/Login_Image.png");
  background-attachment: fixed;
  background-size: cover;
}
.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: left;
  padding: 20px;
  font-family: intermedium;
  font-size: 15px;
  color: #030303;
}
.password-icon {
  cursor: pointer;
}
</style>
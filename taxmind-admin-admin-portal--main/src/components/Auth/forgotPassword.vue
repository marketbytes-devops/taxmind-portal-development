<template>
  <div>
    <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
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

    <v-layout
      wrap
      align-center
      justify-center
      style="min-height: 100vh"
      class="background-color"
    >
      <v-flex xs12 sm8 md6 lg3>
        <v-card class="pa-10">
          <v-card-text>
            <h2 class="forgotpass">Did you forgot your password?</h2>
            <p class="forgotpass1 pt-5">
              Enter your email address you're using for your account below and
              we will send you a password reset link
            </p>
          </v-card-text>

          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="email"
              :rules="[rules.required, rules.email]"
              label="Email Address"
              outlined
              required
              dense
              class="mb-2 text-des"
            ></v-text-field>

            <v-btn
              color="#039379"
              block
              :disabled="!valid"
              @click="passwordSubmit"
              class="btn-primary"
            >
              Send OTP
            </v-btn>
          </v-form>

          <v-card-actions class="justify-center mt-2">
            <router-link to="/loginForm">
              <v-btn style="text-decoration: underline" text class="text-des">
                Back to Log In
              </v-btn>
            </router-link>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>
  
  <script>
import { sendEmailVerification } from '@/api/modules/auth';
export default {
  data() {
    return {
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      email: "",
      valid: false,
      rules: {
        required: (value) => !!value || "Required.",
        email: (value) => /.+@.+\..+/.test(value) || "E-mail must be valid.",
      },
    };
  },
  methods: {
    passwordSubmit() {
      if (this.$refs.form.validate()) {
        sendEmailVerification(this.email)
          .then((response) => {
            const data = response.data || response;
            const status = data.status !== undefined ? data.status : true;
            this.msg = data.message || data.msg || (status ? 'OTP sent' : 'Failed to send OTP');
            this.showSnackBar = true;
            if (status) {
              this.$router.push({
                path: "/otpPage",
                query: { email: this.email },
              });
            }
          })
          .catch((error) => {
            this.msg = error?.response?.data?.message || 'Failed to send OTP';
            this.showSnackBar = true;
            console.error(error);
          });
      } else {
        this.msg = "Please fill out all fields correctly.";
        this.showSnackBar = true;
      }
    },
    // requestResetLink() {
    //   if (this.$refs.form.validate()) {
    //     // Handle the reset link request logic here
    //     console.log("Requesting reset link for:", this.email);
    //   }
    // },
    //   goToLogIn() {
    //     // Logic to navigate to the sign-in page
    //     console.log('Navigating to sign-in');
    //   },
  },
};
</script>
  
  <style scoped>
.background-color {
  background-color: #2aa86638;
  background-image: url("./../../assets/images/Login_Image.png");
  background-attachment: fixed;
  background-size: cover;
}
.btn-primary {
  background-color: #039379 !important;
  color: #fff !important;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  font-family: interregular;
}

.back-link,
.signup-link {
  font-size: 14px;
  color: #666 !important;
  text-decoration: underline;
  font-family: interregular;
}
</style>
  
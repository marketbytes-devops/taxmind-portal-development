<template>
    <div>
        <v-snackbar v-model="showSnackBar" color="#039379" right :timeout="timeout">
            <v-layout wrap justify-center>
              <v-flex text-left class="align-self-center">
                <span style="color: white">
                  {{ msg }}
                </span>
              </v-flex>
              <v-flex text-right>
                <v-btn small :ripple="false" text @click="showSnackBar = false">
                  <v-icon style="color: white">mdi-close</v-icon>
                </v-btn>
              </v-flex>
            </v-layout>
          </v-snackbar>
      <v-layout wrap align-center justify-center style="min-height: 100vh"  class="login_page">
        <v-flex xs12 sm8 md6 lg4>
          <v-card>
            <v-card-text>
              <h2 class="forgotpass">Check Your Email</h2>
              <p class="forgotpass1 pt-5">
                Please enter the 6-digit OTP sent to your email address to reset your password.

              </p>
            </v-card-text>
  
            <v-form >

                <v-layout wrap justify-center >
                    <v-flex xs10>
                       <span class="label">
                         OTP
                       </span>
                       <v-otp-input
                       length="6"   v-model="otp "
                     ></v-otp-input>
                     </v-flex>

                     <v-flex xs10 lg10 px-1 text-right>
                      <span 
                      @click="resendOTP" 
                       style="font-family:opensansregular; cursor: pointer; color: #039379;"
                      >
                        Resend OTP
                      </span>
                    </v-flex>

                     <v-flex xs10 >
                        <span class="label">
                          Email
                        </span>
                        <v-text-field
                        v-model="email"
                       :hide-details="true"
                        placeholder="Email Address"
                        outlined
                        required
                        dense
                        class="pt-2 text-des"
                      ></v-text-field>
                      </v-flex>


                     <v-flex xs10 pt-2>
                        <span class="label">New Password</span>
                        <v-text-field
                         :hide-details="true"
                          ref="password"
                          color="primary"
                          placeholder="••••••••"
                          :type="newPasswordVisible ? 'text' : 'password'"
                          dense outlined
                          v-model="password"
                         class="pt-2 text-des"
                        >
                          <template v-slot:append>
                            <v-icon @click="togglePasswordVisibility2" class="password-icon">
                              {{ newPasswordVisible ? 'mdi-eye' : 'mdi-eye-off' }}
                            </v-icon>
                          </template>
                        </v-text-field>
                      </v-flex>
                      
                      <v-flex xs10 pt-2>
                        <span class="label">Confirm New Password</span>
                        <v-text-field
                         :hide-details="true"
                          ref="newcpassword"
                          color="primary"
                          placeholder="••••••••"
                          :type="confPasswordVisible ? 'text' : 'password'"
                          dense outlined
                          v-model="cpassword"
                          class="pt-2 text-des"
                        >
                          <template v-slot:append>
                            <v-icon @click="togglePasswordVisibility3" class="password-icon">
                              {{ confPasswordVisible ? 'mdi-eye' : 'mdi-eye-off' }}
                            </v-icon>
                          </template>
                        </v-text-field>
                      </v-flex>
                      <v-flex xs10 pt-2>
                        <v-btn
                          block
                         
                          color="#039379"
                        
                        
                         :hide-details="true"
                          @click="validateInput()"
                          class="btn-primary"
                          
                          
                        ><span class="passwordbtn">
                          Change Password</span>
                        </v-btn>
                        </v-flex>
  
              <!-- <v-btn
                color="primary"
                block
                :disabled="!valid"
                @click="passwordSubmit"
                class="btn-primary"
              >
                Request Reset Link
              </v-btn> -->
              </v-layout>
            </v-form>
  
            <v-card-actions class="justify-center mt-2">
                <router-link to="/login">
              <v-btn style=" text-decoration: underline;" text class="text-des">
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
  import { resetPassword, sendEmailVerification } from '@/api/modules/auth';
  export default {
    data() {
      return {
        showSnackBar: false,
        timeout: 5000,
        msg: null,
        password: null,
      cpassword: null,
      otp :null,
      email: this.$route.query.email || '',
      newPasswordVisible: false,
      confPasswordVisible: false,
        // valid: false,
        // rules: {
        //   required: (value) => !!value || "Required.",
        //   email: (value) => /.+@.+\..+/.test(value) || "E-mail must be valid.",
        // },
      };
    },
    methods: {
        togglePasswordVisibility2() {
      this.newPasswordVisible = !this.newPasswordVisible;
    },
    togglePasswordVisibility3() {
      this.confPasswordVisible = !this.confPasswordVisible;
    },
      validateInput() {
    if (!this.otp) {
      this.msg = "Please Provide OTP";
      this.showSnackBar = true;
      return;
    } else if (!this.email) {
      this.msg = "Please Provide Email";
      this.showSnackBar = true;
      return;
    } 
    else if (!this.password) {
      this.msg = "Please Provide New Password";
      this.showSnackBar = true;
      return;
    } else if (!this.cpassword) {
      this.msg = "Please Provide Confirm Password";
      this.showSnackBar = true;
      return;
    } else if (this.password !== this.cpassword) {
      this.msg = "New Password and Confirm Password do not match";
      this.showSnackBar = true;
      return;
    }
     else if (!this.validatePassword(this.password)) {
      this.msg = "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
      this.showSnackBar = true;
      return;
    }
     else {
      this.otpPasswordSubmit();
    }
  },
  validatePassword(password) {
    // Regular expression to check the password criteria
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return passwordRegex.test(password);
  },
  otpPasswordSubmit() {
      resetPassword({ email: this.email, otp: this.otp, newPassword: this.password })
        .then((response) => {
          const data = response.data || response;
          const status = data.status !== undefined ? data.status : true;
          this.msg = data.message || data.msg || (status ? 'Password reset successful' : 'Password reset failed');
          this.showSnackBar = true;
          if (status) this.$router.push({ path: '/login' });
        })
        .catch((error) => {
          this.msg = error?.response?.data?.message || 'Password reset failed';
          this.showSnackBar = true;
          console.error(error);
        });
    },
    resendOTP() {
      this.appLoading = true;
      const email = this.$route.query.email || this.email;
      sendEmailVerification(email)
        .then((response) => {
          const data = response.data || response;
          const status = data.status !== undefined ? data.status : true;
          this.msg = data.message || data.msg || (status ? 'OTP resent' : 'Failed to resend OTP');
          this.showSnackBar = true;
        })
        .catch((err) => {
          this.msg = err?.response?.data?.message || 'Failed to resend OTP';
          this.showSnackBar = true;
        })
        .finally(() => { this.appLoading = false; });
    },
  
    },
  };
  </script>
    
    <style scoped>
    .login_page {
        background-color: #2aa86638;
        background-image: url("./../../assets/images/Login_Image.png");
        background-attachment: fixed;
        background-size: cover;
      }
  .btn-primary {
    background-color: #039379 !important;
    color: #fff !important;
    height: 50px;
    font-size: 16px;
    font-weight: 500;
    font-family: interregular;
  }
  
  

  </style>
    
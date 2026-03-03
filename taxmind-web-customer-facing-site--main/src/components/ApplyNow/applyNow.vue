<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="#1A73E9"
      size="60"
      is-full-screen
    />
    <!-- Global snackbar mounted in App.vue (use this.$snackbar.showSuccess()/showError()) -->
    <v-layout wrap justify-center>
      <v-flex xs12>
        <v-layout wrap justify-center> </v-layout>
        <v-layout
          wrap
          justify-center
          fill-height
          mt-6
          mt-lg-8
          mt-md-8
          mt-sm-6
          pt-15
        >
          <v-flex xs12 pt-sm-16 pt-md-12 pt-lg-12 class="hidden-sm-and-down">
            <v-img
              src="./../../assets/images/aboutustop.webp"
              contain
              alt="aboutustop"
            ></v-img>
          </v-flex>
          <v-flex xs12 pt-sm-3 pt-lg-0 pt-3 class="hidden-md-and-up">
            <v-img
              src="./../../assets/images/aboutustopsmall.webp"
              contain
              alt="aboutustop"
            ></v-img>
          </v-flex>
          <v-flex xs12 sm12 md12 lg12 pt-0 pb-10>
            <v-layout wrap justify-center>
              <v-flex xs12 sm10 md10 lg8>
                <v-card flat rounded="lg" color="#FFFFFF">
                  <v-layout wrap justify-center pa-3 pa-sm-14>
                    <v-flex xs12>
                      <v-layout wrap justify-center>
                        <v-flex xs12 text-left>
                          <span class="applyhead"
                            >Submit Your Tax Claim Effortlessly</span
                          >
                        </v-flex>
                        <v-flex xs12 text-left pt-3 pb-3>
                          <span class="applysubhead"
                            >To assist us in providing you with the best
                            service, please take a moment to accurately fill out
                            the form below</span
                          >
                        </v-flex>
                        <v-flex xs12 text-left>
                          <v-layout wrap justify-center>
                            <v-flex xs12 lg12 md12>
                              <span class="textFieldstyle">Full Name</span>
                              <v-text-field
                                v-model="name"
                                :error="!!validationErrors.name"
                                :error-messages="validationErrors.name"
                                class="rounded-lg pt-1"
                                solo
                                dense
                                outlined
                                flat
                                hide-details="auto"
                                style="font-family: opensansregular"
                              >
                              </v-text-field>
                            </v-flex>
                            <!-- <v-flex xs12 lg6 md6 pl-lg-2 pl-sm-0 pl-md-2>
                              <span class="textFieldstyle">Maiden Name</span>
                              <v-text-field
                                v-model="maidenname"
                                class="rounded-lg pt-1"
                                solo
                                dense
                                outlined
                                flat
                                hide-details="auto"
                                
                                style="font-family: opensansregular"
                              >
                              </v-text-field>
                            </v-flex> -->
                            <v-flex xs12 lg6 md6 pt-lg-2 pt-md-2>
                              <span class="textFieldstyle">Email Address</span>
                              <v-text-field
                                v-model="email"
                                :error="!!validationErrors.email"
                                :error-messages="validationErrors.email"
                                class="rounded-lg pt-1"
                                solo
                                dense
                                outlined
                                flat
                                hide-details="auto"
                              >
                              </v-text-field>
                            </v-flex>
                            <v-flex
                              xs12
                              lg6
                              md6
                              pl-lg-2
                              pl-sm-0
                              pl-md-2
                              pt-lg-2
                              pt-md-2
                            >
                              <PhoneNumberInput
                                v-model="phonenumber"
                                label="Phone Number"
                                :error="!!validationErrors.phonenumber"
                                :error-message="validationErrors.phonenumber"
                                @update:phoneData="onPhoneUpdate"
                              />
                            </v-flex>
                            <v-flex xs12 lg6 md6 pt-lg-2 pt-md-2>
                              <span class="textFieldstyle">Date of Birth</span>
                              <v-menu
                                ref="menu"
                                v-model="menu"
                                :close-on-content-click="false"
                                transition="scale-transition"
                                offset-y
                                min-width="auto"
                              >
                                <template v-slot:activator="{ on, attrs }">
                                  <v-text-field
                                    :value="formattedDate"
                                    append-icon="mdi-calendar"
                                    readonly
                                    v-bind="attrs"
                                    v-on="on"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                    style="font-family: DMSans"
                                  ></v-text-field>
                                </template>
                                <v-date-picker
                                  v-model="date"
                                  :active-picker.sync="activePicker"
                                  :max="
                                    new Date(
                                      Date.now() -
                                        new Date().getTimezoneOffset() * 60000
                                    )
                                      .toISOString()
                                      .substring(0, 10)
                                  "
                                  min="1950-01-01"
                                  @change="save"
                                ></v-date-picker>
                              </v-menu>
                            </v-flex>
                            <v-flex
                              xs12
                              lg6
                              md6
                              pl-lg-2
                              pl-sm-0
                              pl-md-2
                              pt-lg-2
                              pt-md-2
                            >
                              <span class="textFieldstyle">Profession</span>
                              <v-text-field
                                v-model="profession"
                                class="rounded-lg pt-1"
                                solo
                                dense
                                outlined
                                flat
                                hide-details="auto"
                                style="font-family: DMSans"
                              >
                              </v-text-field>
                            </v-flex>
                          </v-layout>
                          <v-layout wrap justify-center pt-lg-2 pt-md-2>
                            <v-flex xs12 lg6 md6>
                              <v-layout wrap justify-center>
                                <v-flex xs12>
                                  <span class="textFieldstyle">PPS Number</span>
                                  <v-text-field
                                    v-model="ppsnumber"
                                    :error="!!validationErrors.ppsnumber"
                                    :error-messages="validationErrors.ppsnumber"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                    style="font-family: DMSans"
                                  >
                                  </v-text-field>
                                </v-flex>
                                <v-flex xs12 pt-md-8>
                                  <span class="textFieldstyle">Eircode</span>
                                  <v-text-field
                                    v-model="ericode"
                                    :error="!!validationErrors.ericode"
                                    :error-messages="validationErrors.ericode"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                    style="font-family: DMSans"
                                  >
                                  </v-text-field>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                            <v-flex xs12 lg6 md6 pl-lg-2 pl-md-2>
                              <span class="textFieldstyle">Address</span>
                              <v-textarea
                                v-model="address"
                                class="rounded-lg pt-1"
                                solo
                                dense
                                outlined
                                flat
                                hide-details="auto"
                              >
                              </v-textarea>
                            </v-flex>
                          </v-layout>
                          <v-layout wrap justify-center pt-lg-2 pt-md-2>
                            <v-flex xs12 lg6 md6>
                              <v-layout align-center>
                                <span class="textFieldstyle">Password</span>
                                <v-tooltip bottom>
                                  <template v-slot:activator="{ on, attrs }">
                                    <v-icon
                                      small
                                      color="#1A73E9"
                                      class="ml-2"
                                      v-bind="attrs"
                                      v-on="on"
                                    >
                                      mdi-information-outline
                                    </v-icon>
                                  </template>
                                  <span>Create a password for your TaxMind portal.</span>
                                </v-tooltip>
                              </v-layout>
                              <v-text-field
                                v-model="password"
                                class="rounded-lg pt-1"
                                :append-icon="
                                  showPassword ? 'mdi-eye' : 'mdi-eye-off'
                                "
                                :type="showPassword ? 'text' : 'password'"
                                @click:append="showPassword = !showPassword"
                                solo
                                dense
                                outlined
                                flat
                                hide-details="auto"
                                style="font-family: DMSans"
                              >
                              </v-text-field>
                            </v-flex>
                            <v-flex
                              xs12
                              lg6
                              md6
                              pl-lg-2
                              pl-sm-0
                              pl-md-2
                              pt-5
                              pt-lg-0
                              pt-sm-5
                              pt-md-0
                            >
                              <span class="textFieldstyle">Marital Status</span>
                              <v-select
                                v-model="maritalstatus"
                                class="rounded-lg pt-1"
                                solo
                                dense
                                :items="maritalstatuslist"
                                item-text="text"
                                item-value="value"
                                outlined
                                flat
                                hide-details="auto"
                                style="font-family: DMSans"
                              >
                              </v-select>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                        <v-flex xs12 v-if="maritalstatus === 'married' || maritalstatus === 'civil_partnership'">
                          <v-layout wrap justify-center pt-5>
                            <v-flex xs12>
                              <v-divider></v-divider>
                            </v-flex>
                            <v-flex xs12 text-left pt-3>
                              <span class="applyhead">Spouse Details</span>
                            </v-flex>
                            <v-flex xs12 text-left pt-5>
                              <v-layout wrap justify-center>
                                <v-flex xs12 lg12 md12>
                                  <span class="textFieldstyle">Full Name</span>
                                  <v-text-field
                                    v-model="spouseDetails.fullName"
                                    :error="!!validationErrors.spouseFullName"
                                    :error-messages="
                                      validationErrors.spouseFullName
                                    "
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                    style="font-family: opensansregular"
                                  >
                                  </v-text-field>
                                </v-flex>
                                <!-- <v-flex xs12 lg6 md6 pl-lg-2 pl-sm-0 pl-md-2>
                                  <span class="textFieldstyle"
                                    >Maiden Name</span
                                  >
                                  <v-text-field
                                    v-model="spouseDetails.maidenName"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                    
                                    style="font-family: opensansregular"
                                  >
                                  </v-text-field>
                                </v-flex> -->
                                <v-flex xs12 lg6 md6 pt-lg-2 pt-md-2>
                                  <span class="textFieldstyle"
                                    >Email Address</span
                                  >
                                  <v-text-field
                                    v-model="spouseDetails.email"
                                    :error="!!validationErrors.spouseEmail"
                                    :error-messages="
                                      validationErrors.spouseEmail
                                    "
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                  >
                                  </v-text-field>
                                </v-flex>
                                <v-flex
                                  xs12
                                  lg6
                                  md6
                                  pl-lg-2
                                  pl-sm-0
                                  pl-md-2
                                  pt-lg-2
                                  pt-md-2
                                >
                                  <PhoneNumberInput
                                    v-model="spouseDetails.phone"
                                    label="Phone Number"
                                    :error="!!validationErrors.spousePhone"
                                    :error-message="validationErrors.spousePhone"
                                    @update:phoneData="onSpousePhoneUpdate"
                                  />
                                </v-flex>
                                <v-flex xs12 lg6 md6 pt-lg-2 pt-md-2>
                                  <span class="textFieldstyle"
                                    >Date of Birth</span
                                  >
                                  <v-menu
                                    ref="menu1"
                                    v-model="menu1"
                                    :close-on-content-click="false"
                                    :return-value.sync="spouseDetails.dob"
                                    transition="scale-transition"
                                    offset-y
                                    min-width="auto"
                                  >
                                    <template v-slot:activator="{ on, attrs }">
                                      <v-text-field
                                        :value="formattedspouseDate"
                                        append-icon="mdi-calendar"
                                        readonly
                                        v-bind="attrs"
                                        v-on="on"
                                        class="rounded-lg pt-1"
                                        solo
                                        dense
                                        outlined
                                        flat
                                        hide-details="auto"
                                        style="font-family: DMSans"
                                      ></v-text-field>
                                    </template>
                                    <v-date-picker
                                      v-model="spouseDetails.dob"
                                      no-title
                                    >
                                      <v-spacer></v-spacer>
                                      <v-btn
                                        text
                                        color="primary"
                                        @click="menu1 = false"
                                      >
                                        Cancel
                                      </v-btn>
                                      <v-btn
                                        text
                                        color="primary"
                                        @click="
                                          $refs.menu1.save(spouseDetails.dob)
                                        "
                                      >
                                        OK
                                      </v-btn>
                                    </v-date-picker>
                                  </v-menu>
                                </v-flex>
                                <v-flex
                                  xs12
                                  lg6
                                  md6
                                  pl-lg-2
                                  pl-sm-0
                                  pl-md-2
                                  pt-lg-2
                                  pt-md-2
                                >
                                  <span class="textFieldstyle">Profession</span>
                                  <v-text-field
                                    v-model="spouseDetails.profession"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                    style="font-family: DMSans"
                                  >
                                  </v-text-field>
                                </v-flex>
                              </v-layout>
                              <v-layout wrap justify-center pt-lg-2 pt-md-2>
                                <v-flex xs12 lg6 md6>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12>
                                      <span class="textFieldstyle"
                                        >PPS Number</span
                                      >
                                      <v-text-field
                                        v-model="spouseDetails.ppsNumber"
                                        :error="!!validationErrors.spousePps"
                                        :error-messages="
                                          validationErrors.spousePps
                                        "
                                        class="rounded-lg pt-1"
                                        solo
                                        dense
                                        outlined
                                        flat
                                        hide-details="auto"
                                        style="font-family: DMSans"
                                      >
                                      </v-text-field>
                                    </v-flex>
                                    <v-flex xs12 pt-md-8>
                                      <v-layout
                                        wrap
                                        justify-center
                                        pt-1
                                        pt-sm-0
                                      >
                                        <v-flex xs6 lg6 md6 sm6>
                                          <span class="textFieldstyle"
                                            >Eircode</span
                                          >
                                        </v-flex>
                                        <v-flex xs6 lg6 md6 sm6>
                                          <v-checkbox
                                            v-model="spouseeircheckbx"
                                            label="Same as above"
                                            color="primary"
                                            value="primary"
                                            hide-details="auto"
                                            @change="fillSpouseEircode"
                                            class="small-checkbox no-space"
                                          ></v-checkbox>
                                        </v-flex>
                                      </v-layout>

                                      <v-text-field
                                        v-model="spouseDetails.eircode"
                                        :error="
                                          !!validationErrors.spouseEircode
                                        "
                                        :error-messages="
                                          validationErrors.spouseEircode
                                        "
                                        class="rounded-lg pt-1"
                                        solo
                                        dense
                                        outlined
                                        flat
                                        hide-details="auto"
                                        style="font-family: DMSans"
                                      >
                                      </v-text-field>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                                <v-flex xs12 lg6 md6 pl-lg-2 pl-md-2>
                                  <v-layout wrap justify-center pt-1 pt-sm-0>
                                    <v-flex xs6 lg6 md6 sm6>
                                      <span class="textFieldstyle"
                                        >Address</span
                                      >
                                    </v-flex>
                                    <v-flex xs6 lg6 md6 sm6>
                                      <v-checkbox
                                        v-model="spouseaddcheckbx"
                                        label="Same as above"
                                        color="primary"
                                        value="primary"
                                        hide-details="auto"
                                        @change="fillSpouseAddress"
                                        class="small-checkbox no-space"
                                      ></v-checkbox>
                                    </v-flex>
                                  </v-layout>
                                  <v-textarea
                                    v-model="spouseDetails.address"
                                    class="rounded-lg pt-1"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                  >
                                  </v-textarea>
                                </v-flex>
                              </v-layout>
                              <v-layout wrap justify-center pt-lg-2 pt-md-2>
                                <v-flex xs12 lg6 md6>
                                  <v-layout align-center>
                                    <span class="textFieldstyle">Password</span>
                                    <v-tooltip bottom>
                                      <template v-slot:activator="{ on, attrs }">
                                        <v-icon
                                          small
                                          color="#1A73E9"
                                          class="ml-2"
                                          v-bind="attrs"
                                          v-on="on"
                                        >
                                          mdi-information-outline
                                        </v-icon>
                                      </template>
                                      <span>Create a password for your spouse's TaxMind portal.</span>
                                    </v-tooltip>
                                  </v-layout>
                                  <v-text-field
                                    v-model="spouseDetails.password"
                                    class="rounded-lg pt-1"
                                    :append-icon="
                                      showSpousePassword ? 'mdi-eye' : 'mdi-eye-off'
                                    "
                                    :type="showSpousePassword ? 'text' : 'password'"
                                    @click:append="showSpousePassword = !showSpousePassword"
                                    solo
                                    dense
                                    outlined
                                    flat
                                    hide-details="auto"
                                    style="font-family: DMSans"
                                  >
                                  </v-text-field>
                                </v-flex>
                                <v-flex xs12 lg6 md6></v-flex>
                              </v-layout>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                        <v-flex xs12 pb-6 pt-10 text-end>
                          <v-layout wrap justify-center>
                            <v-flex xs12 lg7 md8 sm9 text-left>
                              <v-layout wrap justify-start>
                                <v-flex xs2 lg1 md1 sm1>
                                  <v-radio-group
                                    v-model="agree"
                                    :ripple="false"
                                  >
                                    <v-radio
                                      :ripple="false"
                                      color="#094697"
                                      label=""
                                      dense
                                    ></v-radio>
                                  </v-radio-group>
                                </v-flex>
                                <v-flex xs10 lg11 md11 sm11>
                                  <span class="tandc">
                                    I agree to the
                                    <router-link
                                      to="/terms-and-conditions"
                                      style="
                                        color: #094697;
                                        text-decoration: underline !important;
                                        cursor: pointer;
                                      "
                                    >
                                      Terms & Conditions
                                    </router-link>
                                    and Authorization.
                                  </span>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                            <v-flex xs12 lg5 md4 sm3 text-center>
                              <v-btn
                                @click="verifyInput"
                                color="#1A73E9"
                                dark
                                :ripple="false"
                                depressed
                                class="rounded-lg"
                              >
                                <span
                                  style="
                                    font-family: opensansregular;
                                    font-weight: 700px;
                                  "
                                >
                                  Submit
                                </span>
                              </v-btn>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-dialog v-model="showSpouseDetailsDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="headline">Spouse Details</v-card-title>
        <v-card-text>
          Please fill your spouse details below as well.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="showSpouseDetailsDialog = false"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ApiMigrationMixin } from "@/utils/apiMigration";
import PhoneNumberInput from "../Common/PhoneNumberInput.vue";

export default {
  components: {
    PhoneNumberInput,
  },
  mixins: [ApiMigrationMixin],
  metaInfo: {
    title: "Apply Now - Register for Tax Filing with TaxMind",
    meta: [
      {
        name: "description",
        content:
          "Register for tax filing services with TaxMind. Our experts assist individuals and businesses in seamless tax registration and filing processes.",
      },
      {
        name: "keywords",
        content:
          "apply for tax filing, TaxMind registration, tax filing sign-up, online tax registration, business tax filing, personal tax services, tax consultancy",
      },
      {
        property: "og:title",
        content: "Apply Now - Seamless Tax Filing Registration with TaxMind",
      },
      {
        property: "og:description",
        content:
          "Sign up for tax filing services with TaxMind. Our hassle-free registration process ensures expert guidance for individuals and businesses.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/apply-now", // Replace with the actual Apply Now page URL
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
      appLoading: false,
      ServerError: false,
      // Local snackbar removed; use this.$snackbar
      activePicker: "DATE",
      timeout: 1000,
      showSpouseDetailsDialog: false,
      msg: null,
      email: null,
      name: null,
      maidenname: null,
      phonenumber: null,
      profession: null,
      message: null,
      category: null,
      maritalstatuslist: [
        { text: 'Married', value: 'married' },
        { text: 'Single', value: 'single' },
        { text: 'Civil Partnership', value: 'civil_partnership' },
        { text: 'Widowed', value: 'widowed' },
        { text: 'Separated', value: 'separated' },
        { text: 'Divorced', value: 'divorced' },
        { text: 'Married spouse abroad', value: 'married_spouse_abroad' }
      ],
      date: null,
      menu: false,
      ppsnumber: null,
      ericode: null,
      address: null,
      password: null,
      showPassword: false,
      maritalstatus: null,
      spouseDetails: {
        fullName: null,
        email: null,
        phone: null,
        dob: null,
        profession: null,
        ppsNumber: null,
        address: null,
        eircode: null,
        password: null,
      },
      showSpousePassword: false,
      spouseeircheckbx: false,
      spouseaddcheckbx: false,
      spousename: null,
      spousemaidenname: null,
      spouseemail: null,
      spousephonenumber: null,
      activePicker1: null,
      spousedate: null,
      menu1: false,
      spouseprofession: null,
      spouseppsnumber: null,
      spouseericode: null,
      spouseaddress: null,
      agree: false,
      // Field-level validation messages
      validationErrors: {},
      // Phone validation data
      phoneData: null,
      spousePhoneData: null,
    };
  },
  mounted() {},
  computed: {
    formattedDate() {
      if (!this.date) return "";
      const [year, month, day] = this.date.split("-");
      return `${day}-${month}-${year}`;
    },
    formattedspouseDate() {
      if (!this.spouseDetails.dob) return "";
      const [year, month, day] = this.spouseDetails.dob.split("-");
      return `${day}-${month}-${year}`;
    },
  },
  watch: {
    menu(val) {
      // Ensure the date-picker opens in calendar (DATE) view instead of year list
      val && setTimeout(() => (this.activePicker = "DATE"));
    },
    maritalstatus(val) {
      if (val === "married" || val === "civil_partnership") {
        this.showSpouseDetailsDialog = true;
      } else if (val === "single") {
        this.clearSpouseDetails();
      }
    },
    menu1(val) {
      // Ensure spouse date-picker opens in calendar (DATE) view
      val && setTimeout(() => (this.activePicker1 = "DATE"));
    },
  },
  methods: {
    // Helper method to format date from YYYY-MM-DD to DD/MM/YYYY
    formatDateForAPI(dateString) {
      if (!dateString) return null;
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    },

    fillSpouseEircode() {
      if (this.spouseeircheckbx) {
        this.spouseDetails.eircode = this.ericode;
      } else {
        this.spouseDetails.eircode = null;
      }
    },
    fillSpouseAddress() {
      if (this.spouseaddcheckbx) {
        this.spouseDetails.address = this.address;
      } else {
        this.spouseDetails.address = null;
      }
    },

    clearSpouseDetails() {
      this.spouseDetails = {
        fullName: null,
        email: null,
        phone: null,
        dob: null,
        profession: null,
        ppsNumber: null,
        address: null,
        eircode: null,
      };
    },
    save(date) {
      this.$refs.menu.save(date);
    },
    save1(spousedate) {
      this.$refs.menu1.save(spousedate);
    },
    onPhoneUpdate(data) {
      this.phoneData = data;
    },
    onSpousePhoneUpdate(data) {
      this.spousePhoneData = data;
    },
    validatePhoneNumber(phone) {
      // Updated to handle international format
      if (!phone) return false;
      // Check if it's in international format (starts with +)
      if (phone.startsWith('+')) {
        return phone.length >= 10; // Minimum length for international number
      }
      // Legacy validation for backward compatibility
      const phoneRegex = /^[0-9]+$/;
      return phoneRegex.test(phone);
    },

    validateName(name) {
      const nameRegex = /^[a-zA-Z\s]+$/;
      return nameRegex.test(name);
    },
    // Backend-equivalent PPS validation: strip spaces, uppercase, 7 digits + 1-2 letters
    validatePPS(val) {
      if (!val) return false;
      const cleaned = String(val).replace(/\s/g, "").toUpperCase();
      const ppsPattern = /^(\d{7})([A-Z]{1,2})$/;
      if (!ppsPattern.test(cleaned)) return false;
      const match = cleaned.match(ppsPattern);
      if (!match) return false;
      const suffix = match[2];
      // If two-letter suffix, ensure second letter is A-I or W (backend rule)
      if (suffix.length === 2) {
        const second = suffix.charAt(1);
        return /[A-IW]/.test(second);
      }
      return true;
    },
    // Backend-equivalent Eircode validation: strip spaces, uppercase, 7 alphanumeric chars
    validateEircode(val) {
      if (!val) return false;
      const cleaned = String(val).replace(/\s/g, "").toUpperCase();
      const eircodePattern = /^[A-Z0-9]{7}$/;
      return eircodePattern.test(cleaned);
    },
    verifyInput() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Use backend-equivalent validators (validatePPS / validateEircode)
      // clear previous field errors
      this.validationErrors = {};
      if (!this.name) {
        this.validationErrors.name = "Please provide full name";
        return;
      }
      if (!this.validateName(this.name)) {
        this.validationErrors.name =
          "Name should contain only letters and spaces";
        return;
      }
      if (!this.email) {
        this.validationErrors.email = "Please provide an email address";
        return;
      }
      if (!emailRegex.test(this.email)) {
        this.validationErrors.email = "Please provide a valid email address";
        return;
      }
      if (!this.phonenumber) {
        this.validationErrors.phonenumber = "Please provide a phone number";
        return;
      }
      // Validate using phone data from component
      if (this.phoneData && !this.phoneData.isValid) {
        this.validationErrors.phonenumber = "Please provide a valid phone number";
        return;
      }
      if (!this.validatePhoneNumber(this.phonenumber)) {
        this.validationErrors.phonenumber = "Please provide a valid phone number";
        return;
      }
      if (!this.date) {
        this.$snackbar.showError("Please Provide Date Of Birth");
        return;
      }
      if (!this.profession) {
        this.$snackbar.showError("Please Provide Profession");
        return;
      }
      if (!this.ppsnumber) {
        this.validationErrors.ppsnumber = "Please provide PPS number";
        return;
      }
      // Normalize and validate PPS using backend rules
      const ppsClean = String(this.ppsnumber).replace(/\s/g, "").toUpperCase();
      if (!this.validatePPS(ppsClean)) {
        this.validationErrors.ppsnumber =
          "PPS must be valid (7 digits + 1-2 letters)";
        return;
      }
      this.ppsnumber = ppsClean;
      if (!this.ericode) {
        this.validationErrors.ericode = "Please provide Eircode";
        return;
      }
      // Normalize and validate Eircode using backend rules
      const eircodeClean = String(this.ericode || "")
        .replace(/\s/g, "")
        .toUpperCase();
      if (!this.validateEircode(eircodeClean)) {
        this.validationErrors.ericode =
          "Eircode must be 7 alphanumeric characters";
        return;
      }
      this.ericode = eircodeClean;
      if (!this.address) {
        this.$snackbar.showError("Please Provide Address");
        return;
      }
      if (this.agree === false) {
        this.$snackbar.showError("Please Agree To The Terms & Conditions");
        return;
      }
      if (!this.password) {
        this.$snackbar.showError("Please Provide Password");
        return;
      }
      if (!this.maritalstatus) {
        this.$snackbar.showError("Please Provide Marital Status");
        return;
      }
      if (
        (this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") &&
        !this.spouseDetails.fullName
      ) {
        this.validationErrors.spouseFullName =
          "Please provide spouse full name";
        return;
      }
      if (
        (this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") &&
        !this.validateName(this.spouseDetails.fullName)
      ) {
        this.validationErrors.spouseFullName =
          "Spouse name should contain only letters and spaces";
        return;
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.email) {
        this.validationErrors.spouseEmail = "Please provide spouse email";
        return;
      }
      // Validate spouse email format
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && this.spouseDetails.email) {
        if (!emailRegex.test(this.spouseDetails.email)) {
          this.validationErrors.spouseEmail =
            "Please provide a valid spouse email address";
          return;
        }
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.phone) {
        this.validationErrors.spousePhone =
          "Please provide spouse phone number";
        return;
      }
      // Validate using spouse phone data from component
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && this.spousePhoneData && !this.spousePhoneData.isValid) {
        this.validationErrors.spousePhone = "Please provide a valid spouse phone number";
        return;
      }
      if (
        (this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") &&
        !this.validatePhoneNumber(this.spouseDetails.phone)
      ) {
        this.validationErrors.spousePhone =
          "Please provide a valid spouse phone number";
        return;
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.dob) {
        this.$snackbar.showError("Please Provide Date Of Birth Of The Spouse");
        return;
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.profession) {
        this.$snackbar.showError("Please Provide Profession Of The Spouse");
        return;
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.ppsNumber) {
        this.$snackbar.showError("Please Provide PPS Number Of The Spouse");
        return;
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.eircode) {
        this.$snackbar.showError("Please Provide Ericode Of The Spouse");
        return;
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.address) {
        this.$snackbar.showError("Please Provide Address Of The Spouse");
        return;
      }
      if ((this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") && !this.spouseDetails.password) {
        this.$snackbar.showError("Please Provide Password Of The Spouse");
        return;
      }
      this.applynow();
    },
    buildRegistrationPayload() {
      const payload = {
        name: this.name,
        email: this.email,
        password: this.password,
        phone: this.phonenumber,
        dob: this.formatDateForAPI(this.date),
        profession: this.profession,
        ppsNo: this.ppsnumber,
        address: this.address,
        eircode: this.ericode,
        maritalStatus: this.maritalstatus, // Already in correct format from v-select value
      };

      // Add spouse details if married or civil partnership (nested object instead of stringified JSON)
      if (this.maritalstatus === "married" || this.maritalstatus === "civil_partnership") {
        payload.spouse = {
          name: this.spouseDetails.fullName,
          email: this.spouseDetails.email,
          phone: this.spouseDetails.phone,
          dob: this.formatDateForAPI(this.spouseDetails.dob),
          profession: this.spouseDetails.profession,
          ppsNo: this.spouseDetails.ppsNumber,
          address: this.spouseDetails.address,
          eircode: this.spouseDetails.eircode,
          password: this.spouseDetails.password,
        };
      }

      return payload;
    },
    async applynow() {
      try {
        // Signatures are now optional - no validation required

        const payload = this.buildRegistrationPayload();

        // ApiMigrationMixin's submitData handles loading and basic error states automatically
        const response = await this.submitData("/users/auth/signup", payload);
        this.handleRegistrationSuccess(response);
      } catch (error) {
        // Additional error handling for registration-specific scenarios
        console.error("Registration failed:", error);
        // Prefer API-provided error message when available
        let apiMsg = "An error occurred";
        try {
          if (error && error.response && error.response.data) {
            const d = error.response.data;
            apiMsg = d.error || d.message || JSON.stringify(d);
          } else if (error && error.message) {
            apiMsg = error.message;
          }
        } catch (e) {
          // fallback
        }
        this.$snackbar.showError(apiMsg);
      }
    },
    handleRegistrationSuccess(response) {
      // Response format from ApiMigrationMixin submitData: response.data contains the API response
      if (
        response.success ||
        response.status === 200 ||
        response.status === true
      ) {
        // Always redirect to OTP verification page after successful signup
        const queryData = {
          email: this.email || "",
          phone: this.phonenumber || "",
        };

        // Spouse verification is no longer required during initial application.
        // It will be handled at the tax filing stage instead.

        this.$router.push({
          name: "otp-verify",
          query: queryData,
        });

        this.$snackbar.showSuccess(
          response.message || "Registration successful"
        );
        // Note: resetForm() removed to prevent clearing data during navigation
      } else {
        // Prefer response.message or response.error or nested data fields
        const apiMsg =
          response.message ||
          response.error ||
          (response.data && (response.data.message || response.data.error)) ||
          "Registration failed";
        this.$snackbar.showError(apiMsg);
      }
    },

    resetForm() {
      this.name = null;
      this.maidenname = null;
      // Keep email for OTP verification flow
      this.password = null;
      this.phonenumber = null;
      this.date = null;
      this.profession = null;
      this.ppsnumber = null;
      this.ericode = null;
      this.address = null;
      this.maritalstatus = null;
      this.spouseDetails = {
        fullName: null,
        email: null,
        phone: null,
        dob: null,
        profession: null,
        ppsNumber: null,
        address: null,
        eircode: null,
      };
    },
  },
};
</script>

<style scoped>
.form-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: white;
  color: black;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.form-title {
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
}

.submit-btn {
  margin-top: 20px;
  color: white;
  width: 100%;
}
.applyhead {
  font-family: FajallaOne;
  font-size: 24px;
  font-weight: 400;
  color: #1b1212;
}
.applysubhead {
  font-family: DMSans;
  font-size: 18px;
  font-weight: 400;
  color: #000000bd;
}
.textFieldstyle {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
  color: #000000;
}
.tandc {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
}

.spouseeir-checkbox .v-label {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
  color: #000000;
}
.spouseeir-checkbox .v-input--selection-controls__input {
  transform: scale(0.8); /* Adjust the scale value to reduce the size */
}

.small-checkbox .v-input--selection-controls__ripple,
.small-checkbox .v-icon {
  transform: scale(0.75); /* Adjust the scale as needed */
}

.small-checkbox .v-label {
  font-size: 13px; /* Adjust the label size if necessary */
  font-family: DMSans;
}
.no-space .v-input--selection-controls__input {
  margin-right: 0px !important; /* Remove space between checkbox and label */
  padding-right: 0px !important; /* Adjust the padding as well */
}

.no-space .v-label {
  margin-left: 0px !important; /* Eliminate margin on the label */
}
</style>

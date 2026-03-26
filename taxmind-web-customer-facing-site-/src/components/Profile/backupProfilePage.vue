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
    <!-- Global snackbar used via this.$snackbar -->
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12>
        <v-layout
          wrap
          justify-center
          style="background-color: #f1f7ff"
          elevation="0"
        >
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex
                xs12
                lg8
                md7
                sm6
                :text-left="$vuetify.breakpoint.xs ? false : true"
              >
                <span class="profilehead"
                  >Welcome <span class="profilename">{{ name }},</span> Let’s
                  start your tax refund journey.</span
                >
              </v-flex>
              <v-flex
                xs12
                lg4
                md5
                sm6
                :text-end="$vuetify.breakpoint.xs ? false : true"
              >
                <v-btn color="#1A73E9" rounded @click="dialog = true">
                  <span
                    style="
                      font-family: DMSans;
                      font-weight: 600;
                      font-size: 16px;
                      color: #ffffff;
                    "
                    >Start New Claim</span
                  >
                </v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center pt-3>
      <v-flex xs12>
        <v-layout
          wrap
          justify-center
          style="background-color: #f1f7ff"
          elevation="0"
        >
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex xs12 text-left>
                <span class="myprofile">My Profile</span>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-center pt-3>
              <v-flex xs12 text-left>
                <v-card color="white" flat rounded="lg">
                  <v-layout wrap justify-center pa-5>
                    <v-flex xs12 pt-2></v-flex>
                    <v-flex xs12 class="hidden-sm-and-down">
                      <v-layout justify-center>
                        <v-flex xs12>
                          <v-layout wrap justify-center>
                            <v-flex xs12 lg2 md2 sm2>
                              <v-img
                                src="../../assets/images/profileicon.webp"
                                contain
                                width="100px"
                                alt="profileicon"
                                height="100px"
                              ></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm10>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-left align-self-center>
                                  <span
                                    style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    "
                                    >{{ userData.name }}</span
                                  >
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">PPS Number</span
                                      ><br />
                                      <span class="subsubdata">{{
                                        userData.ppsNumber
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">Phone</span><br />
                                      <span class="subsubdata">{{
                                        userData.phone
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">Email</span><br />
                                      <span class="subsubdata">{{
                                        userData.email
                                      }}</span>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                      <v-layout
                        justify-center
                        v-if="userData && userData.spouseDetails"
                        pt-4
                      >
                        <v-flex xs12>
                          <v-layout wrap justify-center>
                            <v-flex xs12 lg2 md2 sm2>
                              <v-img
                                src="../../assets/images/profileiconfemale.webp"
                                contain
                                width="100px"
                                alt="profileiconfemale"
                                height="100px"
                              ></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm10>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-left align-self-center>
                                  <span
                                    style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    "
                                    >{{ userData.spouseDetails.name }}</span
                                  >
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">PPS Number</span
                                      ><br />
                                      <span class="subsubdata">{{
                                        userData.spouseDetails.ppsNumber
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">Phone</span><br />
                                      <span class="subsubdata">{{
                                        userData.spouseDetails.phone
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">Email</span><br />
                                      <span class="subsubdata">{{
                                        userData.spouseDetails.email
                                      }}</span>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                    <v-flex xs12 class="hidden-md-and-up" text-center>
                      <v-layout justify-center>
                        <v-flex xs12>
                          <v-layout wrap justify-center>
                            <v-flex xs4 lg2 md2 sm2>
                              <v-img
                                src="../../assets/images/profileicon.webp"
                                contain
                                width="100px"
                                alt="profileicon"
                                height="100px"
                              ></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm12>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-center align-self-center>
                                  <span
                                    style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    "
                                    >{{ userData.name }}</span
                                  >
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm3>
                                      <span class="subdata">PPS Number</span
                                      ><br />
                                      <span class="subsubdata">{{
                                        userData.ppsNumber
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm3>
                                      <span class="subdata">Phone</span><br />
                                      <span class="subsubdata">{{
                                        userData.phone
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm6>
                                      <span class="subdata">Email</span><br />
                                      <span class="subsubdata">{{
                                        userData.email
                                      }}</span>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                      <v-layout
                        justify-center
                        v-if="userData && userData.spouseDetails"
                        pt-4
                      >
                        <v-flex xs12>
                          <v-layout wrap justify-center>
                            <v-flex xs4 lg2 md2 sm2>
                              <v-img
                                src="../../assets/images/profileiconfemale.webp"
                                contain
                                width="100px"
                                alt="profileiconfemale"
                                height="100px"
                              ></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm12>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-center align-self-center>
                                  <span
                                    style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    "
                                    >{{ userData.spouseDetails.name }}</span
                                  >
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm3>
                                      <span class="subdata">PPS Number</span
                                      ><br />
                                      <span class="subsubdata">{{
                                        userData.spouseDetails.ppsNumber
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm3>
                                      <span class="subdata">Phone</span><br />
                                      <span class="subsubdata">{{
                                        userData.spouseDetails.phone
                                      }}</span>
                                    </v-flex>
                                    <v-flex xs12 lg4 md4 sm6>
                                      <span class="subdata">Email</span><br />
                                      <span class="subsubdata">{{
                                        userData.spouseDetails.email
                                      }}</span>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                    <v-flex xs12 pt-2>
                      <v-layout wrap justify-end>
                        <v-flex xs12 text-end>
                          <span @click="redirectToDetails">
                            <!-- <v-icon color="#1157B3" medium>mdi-eye</v-icon> -->
                            <span
                              style="
                                font-family: DMSans;
                                font-weight: 400;
                                font-size: 18px;
                                color: #1157b3;
                                cursor: pointer;
                              "
                              >View Details</span
                            ></span
                          >
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
    <!-- Application Section -->
    <v-layout wrap justify-center pt-3 v-if="applicationData.length > 0">
      <v-flex
        xs12
        py-2
        v-for="application in applicationData"
        :key="application._id"
      >
        <v-layout
          wrap
          justify-center
          style="background-color: #f1f7ff"
          elevation="0"
        >
          <v-flex xs12 pa-5>
            <v-layout wrap justify-center>
              <v-flex xs4 sm6 md6 lg6 text-left>
                <span class="myprofile">{{ application.year }}</span>
              </v-flex>
              <v-flex xs8 sm6 md6 lg6 text-end>
                <v-chip
                  :color="
                    application.status === 'APPROVED' ? 'green' : 'orange'
                  "
                  class="status-badge"
                >
                  {{
                    application.status === "APPROVED"
                      ? "Approved"
                      : application.status === "PROCESSING"
                      ? "Processing"
                      : "In Progress"
                  }}
                </v-chip>
              </v-flex>
            </v-layout>
            <v-layout wrap justify-center pt-3>
              <v-flex xs12 text-left>
                <v-layout wrap justify-center>
                  <v-flex xs12>
                    <v-layout wrap justify-start fill-height>
                      <v-flex xs12 md12>
                        <v-stepper
                          v-model="application.stepperStep"
                          style="background-color: #f1f7ff"
                          elevation="0"
                        >
                          <v-stepper-header>
                            <v-stepper-step
                              :complete="application.stepperStep > 1"
                              step="1"
                              :color="getStepColor(application, 1)"
                            >
                              <span class="stephead"
                                >Application Submission</span
                              >
                            </v-stepper-step>
                            <v-divider></v-divider>
                            <v-stepper-step
                              :complete="application.stepperStep > 2"
                              step="2"
                              :color="getStepColor(application, 2)"
                            >
                              <span class="stephead">Enquiry</span>
                            </v-stepper-step>
                            <v-divider></v-divider>
                            <v-stepper-step
                              :complete="application.stepperStep > 3"
                              step="3"
                              :color="getStepColor(application, 3)"
                            >
                              <span class="stephead">Bills Upload</span>
                            </v-stepper-step>
                            <v-divider></v-divider>
                            <v-stepper-step
                              :complete="application.stepperStep > 4"
                              step="4"
                              :color="getStepColor(application, 4)"
                            >
                              <span class="stephead"
                                >Processing and Review</span
                              >
                            </v-stepper-step>
                            <v-divider></v-divider>
                            <v-stepper-step
                              step="5"
                              :complete="application.stepperStep > 5"
                              :color="getStepColor(application, 5)"
                            >
                              <span class="stephead">Amount Approved</span>
                            </v-stepper-step>
                          </v-stepper-header>
                          <v-stepper-items>
                            <v-stepper-content step="1">
                              <v-card
                                class="mb-12"
                                color="white"
                                height="200px"
                                elevation="0"
                              ></v-card>

                              <v-btn color="primary" @click="e1 = 2">
                                Continue
                              </v-btn>

                              <v-btn text> Cancel </v-btn>
                            </v-stepper-content>
                            <v-stepper-content step="2">
                              <v-layout
                                wrap
                                justify-center
                                pt-md-10
                                pt-lg-0
                                pt-sm-0
                                pt-0
                                pl-2
                              >
                                <v-flex xs12>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 23px;
                                        "
                                        >Tax Credit Eligibility
                                        Questionnaire</span
                                      >
                                    </v-flex>
                                    <!-- Home Carer Tax Credit -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >1. Home Carer Tax Credit</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <v-select
                                        v-model="application.maritalStatus"
                                        :items="maritalstatuslist"
                                        outlined
                                        label="Marital Status"
                                      >
                                      </v-select>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Does your spouse earn less than €10,400
                                        per year?</span
                                      >
                                      <v-radio-group
                                        v-model="application.spouseEarnings"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Do you care for a dependent child,
                                        elderly person, or disabled
                                        individual?</span
                                      >
                                      <v-radio-group
                                        v-model="application.careDependent"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Enter the PPS Number of the dependent
                                        child (Format: 7 digits + 1
                                        letter)</span
                                      >
                                      <v-text-field
                                        v-model="application.dependentPPSNumber"
                                        label="Enter the PPS Number"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Select the Date of Birth of the
                                        dependent child</span
                                      >
                                    </v-flex>
                                    <v-flex xs12>
                                      <v-menu
                                        v-model="
                                          menu[application._id].dependentDOB
                                        "
                                        :close-on-content-click="false"
                                        :nudge-right="40"
                                        transition="scale-transition"
                                        offset-y
                                        min-width="auto"
                                      >
                                        <template
                                          v-slot:activator="{ on, attrs }"
                                        >
                                          <v-text-field
                                            v-model="application.dependentDOB"
                                            label="Select the Date of Birth"
                                            append-icon="mdi-calendar"
                                            outlined
                                            readonly
                                            v-bind="attrs"
                                            v-on="on"
                                          ></v-text-field>
                                        </template>
                                        <v-date-picker
                                          v-model="application.dependentDOB"
                                          @input="
                                            menu[
                                              application._id
                                            ].dependentDOB = false
                                          "
                                        ></v-date-picker>
                                      </v-menu>
                                    </v-flex>
                                    <!-- Medical Expenses Tax Credit -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >2. Medical Expenses Tax Credit</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Have you incurred medical or dental
                                        expenses not covered by insurance?</span
                                      >
                                      <v-radio-group
                                        v-model="application.medicalExpenses"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Do you have receipts for these
                                        expenses?</span
                                      >
                                      <v-radio-group
                                        v-model="application.medicalReceipts"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Enter the total amount of medical
                                        expenses incurred (€)</span
                                      >
                                      <v-text-field
                                        v-model="
                                          application.totalMedicalExpenses
                                        "
                                        label="Enter Amount"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <!-- Dependent Relative Tax Credit -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >3. Dependent Relative Tax Credit</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Do you financially support a relative
                                        who is unable to support
                                        themselves?</span
                                      >
                                      <v-radio-group
                                        v-model="application.supportRelative"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Select the dependent relative’s
                                        relation</span
                                      >
                                      <v-select
                                        v-model="application.relativeRelation"
                                        :items="[
                                          'Parent',
                                          'Grandparent',
                                          'Sibling',
                                          'Child Over 18',
                                        ]"
                                        label="Select"
                                        outlined
                                      ></v-select>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Does their annual income fall below
                                        €16,000?</span
                                      >
                                      <v-radio-group
                                        v-model="application.relativeIncome"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <!-- Tuition Fees Tax Credit -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >4. Tuition Fees Tax Credit</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Have you paid tuition fees for a higher
                                        education course?</span
                                      >
                                      <v-radio-group
                                        v-model="application.tuitionFees"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Is the course in an approved Irish or
                                        EU institution?</span
                                      >
                                      <v-radio-group
                                        v-model="
                                          application.approvedInstitution
                                        "
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Do you have official fee payment
                                        receipts?</span
                                      >
                                      <v-radio-group
                                        v-model="application.feeReceipts"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Enter the total amount of tuition fees
                                        paid (€)</span
                                      >
                                      <v-text-field
                                        v-model="application.totalTuitionFees"
                                        label="Enter the total amount"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <!-- Rent Tax Credit -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >5. Rent Tax Credit</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Have you paid rent for private
                                        accommodation in Ireland?</span
                                      >
                                      <v-radio-group
                                        v-model="application.paidRent"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Is your tenancy registered with the
                                        RTB?</span
                                      >
                                      <v-radio-group
                                        v-model="application.registeredRTB"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Enter RTB registration number (Format:
                                        Alphanumeric, 9-12 characters)</span
                                      >
                                      <v-text-field
                                        v-model="
                                          application.rtbRegistrationNumber
                                        "
                                        label="Enter RTB registration number"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span>Select tenancy start date</span>
                                    </v-flex>
                                    <v-flex xs12>
                                      <v-menu
                                        v-model="
                                          menu[application._id].tenancyStartDate
                                        "
                                        :close-on-content-click="false"
                                        :nudge-right="40"
                                        transition="scale-transition"
                                        offset-y
                                        min-width="auto"
                                      >
                                        <template
                                          v-slot:activator="{ on, attrs }"
                                        >
                                          <v-text-field
                                            v-model="
                                              application.tenancyStartDate
                                            "
                                            label="Start date"
                                            append-icon="mdi-calendar"
                                            readonly
                                            outlined
                                            v-bind="attrs"
                                            v-on="on"
                                          ></v-text-field>
                                        </template>
                                        <v-date-picker
                                          v-model="application.tenancyStartDate"
                                          @input="
                                            menu[
                                              application._id
                                            ].tenancyStartDate = false
                                          "
                                        ></v-date-picker>
                                      </v-menu>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span>Select tenancy end date</span>
                                    </v-flex>
                                    <v-flex xs12>
                                      <v-menu
                                        v-model="
                                          menu[application._id].tenancyEndDate
                                        "
                                        :close-on-content-click="false"
                                        :nudge-right="40"
                                        transition="scale-transition"
                                        offset-y
                                        min-width="auto"
                                      >
                                        <template
                                          v-slot:activator="{ on, attrs }"
                                        >
                                          <v-text-field
                                            v-model="application.tenancyEndDate"
                                            label="End date"
                                            append-icon="mdi-calendar"
                                            readonly
                                            outlined
                                            v-bind="attrs"
                                            v-on="on"
                                          ></v-text-field>
                                        </template>
                                        <v-date-picker
                                          v-model="application.tenancyEndDate"
                                          @input="
                                            menu[
                                              application._id
                                            ].tenancyEndDate = false
                                          "
                                        ></v-date-picker>
                                      </v-menu>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span>Enter landlord’s full name</span>
                                      <v-text-field
                                        v-model="application.landlordName"
                                        label="Full Name"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Enter property address with Eircode
                                        (Format: Standard Irish Eircode)</span
                                      >
                                      <v-text-field
                                        v-model="application.propertyAddress"
                                        label="Enter property address"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <!-- Remote Working Tax Credit -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >6. Remote Working Tax Credit</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Have you worked from home for at least
                                        30% of your working days?</span
                                      >
                                      <v-radio-group
                                        v-model="application.remoteWorking"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Have you paid for home office expenses
                                        (electricity, broadband, heating)?</span
                                      >
                                      <v-radio-group
                                        v-model="application.homeOfficeExpenses"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Do you have receipts or employer
                                        confirmation for these expenses?</span
                                      >
                                      <v-radio-group
                                        v-model="application.expenseReceipts"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <!-- Flat Rate Expenses -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >7. Flat Rate Expenses</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <v-text-field
                                        v-model="application.profession"
                                        label="Profession"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Do you work in a profession eligible
                                        for flat rate expenses?</span
                                      >
                                      <v-radio-group
                                        v-model="application.flatRateExpenses"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <!-- Mortgage Interest Relief -->
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 20px;
                                        "
                                        >8. Mortgage Interest Relief (for older
                                        loans)</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Did you take out a mortgage before
                                        2022?</span
                                      >
                                      <v-radio-group
                                        v-model="application.mortgageBefore2022"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Is there a remaining balance between
                                        €80,000 and €500,000?</span
                                      >
                                      <v-radio-group
                                        v-model="application.remainingBalance"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Are you paying more interest in 2023
                                        and 2024 compared to 2022?</span
                                      >
                                      <v-radio-group
                                        v-model="application.additionalInterest"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Enter the additional interest paid
                                        (€)</span
                                      >
                                      <v-text-field
                                        v-model="
                                          application.additionalInterestPaid
                                        "
                                        label="Enter the additional interest"
                                        outlined
                                      ></v-text-field>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        >Are you still repaying the
                                        mortgage?</span
                                      >
                                      <v-radio-group
                                        v-model="application.stillRepaying"
                                      >
                                        <v-radio
                                          label="Yes"
                                          value="yes"
                                        ></v-radio>
                                        <v-radio
                                          label="No"
                                          value="no"
                                        ></v-radio>
                                      </v-radio-group>
                                    </v-flex>
                                    <!-- Next Button -->
                                    <v-flex xs12 lg10 sm10 text-end pt-4>
                                      <v-btn
                                        color="#1A73E9"
                                        rounded
                                        @click="submitStepTwo(application)"
                                      >
                                        <span
                                          style="
                                            font-family: DMSans;
                                            font-weight: 600;
                                            font-size: 16px;
                                            color: #ffffff;
                                          "
                                          >Submit</span
                                        >
                                      </v-btn>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-stepper-content>
                            <v-stepper-content step="3">
                              <v-layout
                                wrap
                                justify-center
                                pt-md-10
                                pt-lg-0
                                pt-sm-0
                                pt-0
                              >
                                <v-flex xs12>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 23px;
                                        "
                                        >Upload Required Documents</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 400;
                                          font-size: 18px;
                                        "
                                      >
                                        Upload necessary files like income
                                        statements (P60/P45), receipts for
                                        claims, or other tax-related
                                        documentation for the year
                                        <span style="font-weight: 700"
                                          >{{ application.year }}.</span
                                        >
                                      </span>
                                    </v-flex>
                                  </v-layout>
                                  <!-- Uploaded Files -->
                                  <v-layout wrap justify-start pt-2 pb-2>
                                    <v-flex
                                      xs12
                                      lg7
                                      py-2
                                      v-for="file in application.documents"
                                      :key="file._id"
                                    >
                                      <v-card
                                        rounded="lg"
                                        flat
                                        v-if="
                                          application &&
                                          application.documents.length > 0
                                        "
                                      >
                                        <v-layout wrap justify-center pa-5>
                                          <v-flex xs11 lg10 md10 sm6>
                                            <v-layout wrap justify-center>
                                              <v-flex xs12>
                                                <span
                                                  style="
                                                    font-family: DMSans;
                                                    font-weight: 400;
                                                    font-size: 18px;
                                                    color: #000000;
                                                  "
                                                  >{{
                                                    file.categoryId.name
                                                  }}</span
                                                >
                                              </v-flex>
                                              <v-flex xs12>
                                                <span
                                                  style="
                                                    font-family: DMSans;
                                                    font-weight: 400;
                                                    font-size: 18px;
                                                    color: #000000;
                                                  "
                                                  >{{
                                                    file.originalFileName
                                                  }}</span
                                                >
                                              </v-flex>
                                              <v-flex xs12>
                                                <span
                                                  style="
                                                    font-family: DMSans;
                                                    font-weight: 400;
                                                    font-size: 14px;
                                                  "
                                                  >{{
                                                    formatDate(file.uploadDate)
                                                  }}</span
                                                >
                                              </v-flex>
                                            </v-layout>
                                          </v-flex>
                                          <v-flex
                                            xs1
                                            sm6
                                            md12
                                            lg2
                                            text-right
                                            align-self-center
                                          >
                                            <v-layout wrap justify-center>
                                              <v-flex xs12 align-self-center>
                                                <v-icon color="#1A73E9"
                                                  >mdi-check</v-icon
                                                >
                                              </v-flex>
                                            </v-layout>
                                          </v-flex>
                                        </v-layout>
                                      </v-card>
                                    </v-flex>
                                  </v-layout>
                                  <v-layout wrap justify-center pb-2>
                                    <v-flex xs12>
                                      <v-layout wrap justify-start>
                                        <v-flex xs12 lg7>
                                          <span
                                            style="
                                              font-family: DMSans;
                                              font-weight: 400;
                                              font-size: 18px;
                                            "
                                            >Select Document Upload
                                            category</span
                                          >
                                          <v-select
                                            v-model="
                                              applicationDocuments[
                                                application._id
                                              ].category
                                            "
                                            class="rounded-lg pt-1"
                                            solo
                                            dense
                                            item-text="name"
                                            item-value="_id"
                                            :items="documentcategorylist"
                                            outlined
                                            flat
                                            hide-details
                                            style="font-family: DMSans"
                                          >
                                          </v-select>
                                        </v-flex>
                                      </v-layout>
                                    </v-flex>
                                  </v-layout>
                                  <!-- File Upload -->
                                  <v-layout wrap justify-center pb-2>
                                    <v-flex xs12>
                                      <v-layout wrap justify-start>
                                        <v-flex xs12>
                                          <span
                                            style="
                                              font-family: DMSans;
                                              font-weight: 400;
                                              font-size: 18px;
                                            "
                                            >Select Document</span
                                          >
                                        </v-flex>
                                        <v-flex
                                          xs11
                                          sm11
                                          md11
                                          lg11
                                          pa-16
                                          align-self-center
                                          text-center
                                          style="
                                            border-style: dotted;
                                            border-color: #3574c6;
                                            border-radius: 5px;
                                            cursor: pointer;
                                            background-color: white;
                                          "
                                          @click="
                                            triggerFileInput(application._id)
                                          "
                                        >
                                          <v-layout
                                            wrap
                                            justify-center
                                            pt-0
                                            style="border: 1px"
                                          >
                                            <v-flex xs12 sm12 md12 lg12>
                                              <v-layout wrap justify-center>
                                                <v-flex xs12 sm12 md12 lg12>
                                                  <v-layout wrap justify-center>
                                                    <v-flex
                                                      xs12
                                                      sm4
                                                      md3
                                                      lg2
                                                      text-center
                                                      align-self-center
                                                      fill-height
                                                    >
                                                      <v-img
                                                        src="../../assets/images/upload.png"
                                                        contain
                                                        height="50px"
                                                        alt="upload"
                                                        width="100px"
                                                      ></v-img>
                                                    </v-flex>
                                                    <v-flex xs12 text-center>
                                                      <span
                                                        style="
                                                          font-family: opensansregular;
                                                          font-size: 16px;
                                                          font-weight: 600;
                                                          color: #676767;
                                                        "
                                                      >
                                                        {{
                                                          getFileName(
                                                            application._id
                                                          )
                                                        }}
                                                      </span>
                                                    </v-flex>
                                                  </v-layout>
                                                  <input
                                                    :ref="
                                                      'fileInput-' +
                                                      application._id
                                                    "
                                                    v-show="false"
                                                    type="file"
                                                    @change="
                                                      (event) =>
                                                        uploadDoc(
                                                          event,
                                                          application._id
                                                        )
                                                    "
                                                  />
                                                </v-flex>
                                              </v-layout>
                                            </v-flex>
                                          </v-layout>
                                        </v-flex>
                                      </v-layout>
                                    </v-flex>
                                  </v-layout>
                                  <v-layout wrap justify-center pb-2>
                                    <v-flex xs12 lg10 sm10 text-end>
                                      <v-btn
                                        color="#1A73E9"
                                        rounded
                                        @click="
                                          verifydocumentupload(application)
                                        "
                                      >
                                        <span
                                          style="
                                            font-family: DMSans;
                                            font-weight: 600;
                                            font-size: 16px;
                                            color: #ffffff;
                                          "
                                          >Upload</span
                                        >
                                      </v-btn>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-stepper-content>
                            <v-stepper-content step="4">
                              <v-layout
                                wrap
                                justify-center
                                pt-md-10
                                pt-lg-0
                                pt-sm-0
                                pt-0
                              >
                                <v-flex xs12>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 text-center>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 700;
                                          font-size: 23px;
                                        "
                                        >Your application is currently under
                                        review.</span
                                      >
                                    </v-flex>
                                    <v-flex xs12 pt-2 text-center>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 400;
                                          font-size: 18px;
                                        "
                                      >
                                        Our team is processing your request, and
                                        you will be notified once the review is
                                        complete. Thank you for your patience.
                                      </span>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-stepper-content>
                            <v-stepper-content step="5">
                              <v-layout
                                wrap
                                justify-center
                                pt-md-10
                                pt-lg-0
                                pt-sm-0
                                pt-0
                              >
                                <v-flex xs12>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12>
                                      <v-layout wrap justify-center>
                                        <v-flex xs3 lg2 md3 sm3 text-left>
                                          <v-img
                                            src="../../assets/images/amountapproved.webp"
                                            contain
                                            alt="amountapproved"
                                            height="100px"
                                            width="100px"
                                          ></v-img>
                                        </v-flex>
                                        <v-flex xs12 lg10 sm9 md9>
                                          <v-layout wrap justify-start>
                                            <v-flex xs12>
                                              <span
                                                style="
                                                  font-family: DMSans;
                                                  font-weight: 700;
                                                  font-size: 23px;
                                                "
                                                >Amount Approved By the
                                                Government</span
                                              >
                                            </v-flex>
                                            <v-flex xs12 lg10 pt-3>
                                              <span
                                                style="
                                                  font-family: DMSans;
                                                  font-weight: 400;
                                                  font-size: 18px;
                                                "
                                                >Once your refund is approved,
                                                the amount is transferred
                                                directly to your bank account or
                                                issued via cheque.</span
                                              >
                                            </v-flex>
                                          </v-layout>
                                        </v-flex>
                                      </v-layout>
                                    </v-flex>
                                    <v-flex xs12 pt-2>
                                      <span
                                        style="
                                          font-family: DMSans;
                                          font-weight: 400;
                                          font-size: 18px;
                                        "
                                      >
                                        Commission Details:
                                      </span>
                                      <ul style="margin: 0; padding-left: 20px">
                                        <!-- List style for subpoints -->
                                        <li
                                          style="
                                            font-family: DMSans;
                                            font-weight: 400;
                                            font-size: 16px;
                                          "
                                        >
                                          Standard Fee: 7% of the total tax
                                          refund amount.
                                        </li>
                                        <li
                                          style="
                                            font-family: DMSans;
                                            font-weight: 400;
                                            font-size: 16px;
                                          "
                                        >
                                          Why It's Easy: Secure, fast, and
                                          ensures your refund is processed
                                          without delays.
                                        </li>
                                      </ul>
                                    </v-flex>
                                  </v-layout>
                                  <v-layout wrap justify-center pt-5 pb-5>
                                    <v-flex xs12>
                                      <v-divider
                                        style="color: #000000"
                                      ></v-divider>
                                    </v-flex>
                                  </v-layout>
                                  <v-layout
                                    wrap
                                    justify-start
                                    pt-2
                                    pb-2
                                    class="hidden-xs-only"
                                  >
                                    <v-flex xs12 lg8>
                                      <v-card rounded="lg" flat>
                                        <v-layout wrap justify-center>
                                          <v-flex xs12 pa-2 pa-sm-8>
                                            <!-- <v-layout wrap justify-center pb-4>
                                                <v-flex xs12>
                                                  <v-layout wrap justify-center>
                                                    <v-flex xs12 sm8 lg8>
                                                      <v-text-field
                                                        v-model="promocode"
                                                        class="rounded-lg pt-1"
                                                        solo
                                                        placeholder="Promo code"
                                                        dense
                                                        outlined
                                                        flat
                                                        hide-details
                                                        color="#F4F4F4"
                                                        style="
                                                          font-family: opensansregular;
                                                        "
                                                      >
                                                      </v-text-field>
                                                    </v-flex>
                                                    <v-flex
                                                      xs12
                                                      sm4
                                                      lg4
                                                      text-end
                                                      pl-lg-2
                                                      pl-sm-2
                                                      align-self-center
                                                      pt-2
                                                      pt-lg-0
                                                      pt-md-0
                                                      pt-sm-0
                                                    >
                                                      <v-btn
                                                        color="#B6F7AE94"
                                                        rounded
                                                        large
                                                        elevation="0"
                                                        @click="
                                                          verifydocumentupload
                                                        "
                                                      >
                                                        <span
                                                          style="
                                                            font-family: DMSans;
                                                            font-weight: 500;
                                                            font-size: 16px;
                                                            color: #1da90c;
                                                          "
                                                          >APPLY</span
                                                        >
                                                      </v-btn>
                                                    </v-flex>
                                                  </v-layout>
                                                </v-flex>
                                              </v-layout> -->
                                            <v-layout wrap justify-center>
                                              <v-flex xs7 sm6 md6 lg8 text-left>
                                                <span class="commission"
                                                  >Refund Amount
                                                </span>
                                              </v-flex>
                                              <v-flex xs5 sm6 md6 lg4 text-end>
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    application.refundAmount
                                                      ? application.refundAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex xs7 sm6 md6 lg8 text-left>
                                                <span class="commission"
                                                  >Commission ({{
                                                    application.commissionPercentage
                                                  }}%)
                                                </span>
                                              </v-flex>
                                              <v-flex xs5 sm6 md6 lg4 text-end>
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    application.commissionAmount
                                                      ? application.commissionAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}</span
                                                >
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex xs7 sm6 md6 lg8 text-left>
                                                <span class="commission"
                                                  >VAT ({{
                                                    application.vatPercentage
                                                  }}%)
                                                </span>
                                              </v-flex>
                                              <v-flex xs5 sm6 md6 lg4 text-end>
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    application.vatAmount
                                                      ? application.vatAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex xs7 sm6 md6 lg8 text-left>
                                                <span class="commission"
                                                  >Commission Amount
                                                </span>
                                              </v-flex>
                                              <v-flex xs5 sm6 md6 lg4 text-end>
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    (
                                                      (application.totalCommissionAmount ||
                                                        0) +
                                                      (application.discountAmount ||
                                                        0)
                                                    ).toFixed(2)
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex xs7 sm6 md6 lg8 text-left>
                                                <span class="commission"
                                                  >Discount
                                                </span>
                                              </v-flex>
                                              <v-flex xs5 sm6 md6 lg4 text-end>
                                                <span class="commissionvalue"
                                                  >- €
                                                  {{
                                                    application.discountAmount
                                                      ? application.discountAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>

                                            <v-layout wrap justify-center pt-8>
                                              <v-flex xs7 sm6 md6 lg8 text-left>
                                                <span class="commission"
                                                  >TOTAL AMOUNT</span
                                                >
                                              </v-flex>
                                              <v-flex xs5 sm6 md6 lg4 text-end>
                                                <span class="commissionvalue"
                                                  ><b>
                                                    €
                                                    {{
                                                      application.totalCommissionAmount
                                                        ? application.totalCommissionAmount.toFixed(
                                                            2
                                                          )
                                                        : "0.00"
                                                    }}
                                                  </b>
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                          </v-flex>
                                        </v-layout>
                                      </v-card>
                                    </v-flex>
                                    <v-flex xs12 lg8 text-end pt-4>
                                      <v-btn color="#1DA90C" rounded>
                                        <span
                                          style="
                                            font-family: DMSans;
                                            font-weight: 500;
                                            font-size: 16px;
                                            color: #ffffff;
                                          "
                                          >Pay Now</span
                                        >
                                      </v-btn>
                                    </v-flex>
                                  </v-layout>
                                  <v-layout
                                    wrap
                                    justify-center
                                    pt-2
                                    pb-2
                                    class="hidden-sm-and-up"
                                  >
                                    <v-flex xs12 lg8>
                                      <v-card rounded="lg" flat>
                                        <v-layout wrap justify-center>
                                          <v-flex xs12 pa-2 pa-sm-8>
                                            <!-- <v-layout wrap justify-center pb-4>
                                                <v-flex xs12>
                                                  <v-layout wrap justify-center>
                                                    <v-flex xs12 sm8 lg8>
                                                      <v-text-field
                                                        v-model="promocode"
                                                        class="rounded-lg pt-1"
                                                        solo
                                                        placeholder="Promo code"
                                                        dense
                                                        outlined
                                                        flat
                                                        hide-details
                                                        color="#F4F4F4"
                                                        style="
                                                          font-family: opensansregular;
                                                        "
                                                      >
                                                      </v-text-field>
                                                    </v-flex>
                                                    <v-flex
                                                      xs12
                                                      sm4
                                                      lg4
                                                      text-end
                                                      pl-lg-2
                                                      pl-sm-2
                                                      align-self-center
                                                      pt-2
                                                      pt-lg-0
                                                      pt-md-0
                                                      pt-sm-0
                                                    >
                                                      <v-btn
                                                        color="#B6F7AE94"
                                                        rounded
                                                        large
                                                        elevation="0"
                                                        @click="
                                                          verifydocumentupload
                                                        "
                                                      >
                                                        <span
                                                          style="
                                                            font-family: DMSans;
                                                            font-weight: 500;
                                                            font-size: 16px;
                                                            color: #1da90c;
                                                          "
                                                          >APPLY</span
                                                        >
                                                      </v-btn>
                                                    </v-flex>
                                                  </v-layout>
                                                </v-flex>
                                              </v-layout> -->
                                            <v-layout wrap justify-center>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg8
                                                text-center
                                              >
                                                <span class="commission"
                                                  >Refund Amount
                                                </span>
                                              </v-flex>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg4
                                                text-center
                                              >
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    application.refundAmount
                                                      ? application.refundAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg8
                                                text-center
                                              >
                                                <span class="commission"
                                                  >Commission ({{
                                                    application.commissionPercentage
                                                  }}%)
                                                </span>
                                              </v-flex>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg4
                                                text-center
                                              >
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    application.commissionAmount
                                                      ? application.commissionAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}</span
                                                >
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg8
                                                text-center
                                              >
                                                <span class="commission"
                                                  >VAT ({{
                                                    application.vatPercentage
                                                  }}%)
                                                </span>
                                              </v-flex>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg4
                                                text-center
                                              >
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    application.vatAmount
                                                      ? application.vatAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg8
                                                text-center
                                              >
                                                <span class="commission"
                                                  >Commission Amount
                                                </span>
                                              </v-flex>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg4
                                                text-center
                                              >
                                                <span class="commissionvalue">
                                                  €
                                                  {{
                                                    (
                                                      (application.totalCommissionAmount ||
                                                        0) +
                                                      (application.discountAmount ||
                                                        0)
                                                    ).toFixed(2)
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                            <v-layout wrap justify-center pt-4>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg8
                                                text-center
                                              >
                                                <span class="commission"
                                                  >Discount
                                                </span>
                                              </v-flex>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg4
                                                text-center
                                              >
                                                <span class="commissionvalue"
                                                  >- €
                                                  {{
                                                    application.discountAmount
                                                      ? application.discountAmount.toFixed(
                                                          2
                                                        )
                                                      : "0.00"
                                                  }}
                                                </span>
                                              </v-flex>
                                            </v-layout>

                                            <v-layout wrap justify-center pt-8>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg8
                                                text-center
                                              >
                                                <span class="commission"
                                                  >TOTAL AMOUNT</span
                                                >
                                              </v-flex>
                                              <v-flex
                                                xs12
                                                sm6
                                                md6
                                                lg4
                                                text-center
                                              >
                                                <span class="commissionvalue"
                                                  ><b>
                                                    €
                                                    {{
                                                      application.totalCommissionAmount
                                                        ? application.totalCommissionAmount.toFixed(
                                                            2
                                                          )
                                                        : "0.00"
                                                    }}
                                                  </b>
                                                </span>
                                              </v-flex>
                                            </v-layout>
                                          </v-flex>
                                        </v-layout>
                                      </v-card>
                                    </v-flex>
                                    <v-flex xs12 lg8 text-center pt-4>
                                      <v-btn color="#1DA90C" rounded>
                                        <span
                                          style="
                                            font-family: DMSans;
                                            font-weight: 500;
                                            font-size: 16px;
                                            color: #ffffff;
                                          "
                                          >Pay Now</span
                                        >
                                      </v-btn>
                                    </v-flex>
                                  </v-layout>
                                </v-flex>
                              </v-layout>
                            </v-stepper-content>
                          </v-stepper-items>
                        </v-stepper>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center pt-2>
      <v-flex xs12>
        <div class="text-center pb-5" v-if="pages > 1">
          <v-pagination
            :length="pages"
            v-model="currentPage"
            color="#1A73E9"
            circle
          ></v-pagination>
        </div>
      </v-flex>
    </v-layout>
    <v-layout
      wrap
      justify-center
      v-if="applicationData && applicationData.length === 0"
    >
      <v-flex xs12 text-center
        ><span style="font-family: DMSans">No Data Found!</span></v-flex
      >
    </v-layout>
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title
          ><span style="font-family: DMSans"
            >Start New Claim</span
          ></v-card-title
        >
        <v-card-text>
          <v-layout wrap justify-center>
            <v-flex xs12>
              <v-layout wrap justify-center>
                <v-flex xs12 text-left>
                  <span
                    style="font-family: DMSans; font-size: 18px; color: black"
                    >Claim Year</span
                  >
                  <v-select
                    v-model="claimyear"
                    class="rounded-lg pt-1"
                    solo
                    dense
                    :items="claimyearList"
                    outlined
                    flat
                    hide-details
                    style="font-family: DMSans"
                  >
                  </v-select>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="dialog = false"
            style="font-family: DMSans"
            >Close</v-btn
          >
          <v-btn color="success" @click="newClaim()" style="font-family: DMSans"
            >Apply</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
  <script>
import axios from "axios";
import { ApiMigrationMixin } from "@/utils/apiMigration";

export default {
  mixins: [ApiMigrationMixin],
  data() {
    return {
      appLoading: false,
      ServerError: false,
      // Global snackbar used via this.$snackbar
      userData: {},
      name: null,
      email: null,
      phone: null,
      claimyear: null,
      claimyearList: [],
      applicationDocuments: {},
      documentcategory: null,
      applicationstatus: null,
      documentcategorylist: [],
      maritalstatuslist: ["Married", "Single"],
      amountDetails: {},
      promocode: "",
      dob: null,
      dialog: false,
      uploadedFileName: "",
      applicationData: [],
      mainapplicationid: null,
      page: 1,
      currentPage: 1,
      pages: 0,
      limit: 5,
      files: [],
      e1: 2,
      menu: {}, // Initialize menu object
      menuStart: false,
      menuEnd: false,
    };
  },
  beforeMount() {
    this.getApplicationData();
    this.generateYears();
    this.getDocumentCategoryData();
    setTimeout(() => {
      this.getData();
    }, 1000); // Delay of 1 second
  },
  watch: {
    currentPage() {
      this.getApplicationData();
    },
  },
  computed: {
    formattedDateOfBirth() {
      if (!this.dob) return "_____________";
      const date = new Date(this.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
  },
  methods: {
    getFileName(applicationId) {
      return (
        this.applicationDocuments[applicationId]?.fileName ||
        "+ Upload Document"
      );
    },
    submitStepTwo(application) {
      const id = application._id;
      const allQuestionAnswers = [
        {
          category: "Home Carer Tax Credit",
          questions: [
            {
              question: "Marital Status",
              answer: application.maritalStatus,
              answerType: "String",
            },
            {
              question: "Does your spouse earn less than €10,400 per year?",
              answer: application.spouseEarnings,
              answerType: "String",
            },
            {
              question:
                "Do you care for a dependent child, elderly person, or disabled individual?",
              answer: application.careDependent,
              answerType: "String",
            },
            {
              question: "Enter the PPS Number of the dependent child",
              answer: application.dependentPPSNumber,
              answerType: "String",
            },
            {
              question: "Select the Date of Birth of the dependent child",
              answer: application.dependentDOB,
              answerType: "Date",
            },
          ],
        },
        {
          category: "Medical Expenses Tax Credit",
          questions: [
            {
              question:
                "Have you incurred medical or dental expenses not covered by insurance?",
              answer: application.medicalExpenses,
              answerType: "String",
            },
            {
              question: "Do you have receipts for these expenses?",
              answer: application.medicalReceipts,
              answerType: "String",
            },
            {
              question:
                "Enter the total amount of medical expenses incurred (€)",
              answer: application.totalMedicalExpenses,
              answerType: "Number",
            },
          ],
        },
        {
          category: "Dependent Relative Tax Credit",
          questions: [
            {
              question:
                "Do you financially support a relative who is unable to support themselves?",
              answer: application.supportRelative,
              answerType: "String",
            },
            {
              question: "Select the dependent relative’s relation",
              answer: application.relativeRelation,
              answerType: "String",
            },
            {
              question: "Does their annual income fall below €16,000?",
              answer: application.relativeIncome,
              answerType: "String",
            },
          ],
        },
        {
          category: "Tuition Fees Tax Credit",
          questions: [
            {
              question:
                "Have you paid tuition fees for a higher education course?",
              answer: application.tuitionFees,
              answerType: "String",
            },
            {
              question: "Is the course in an approved Irish or EU institution?",
              answer: application.approvedInstitution,
              answerType: "String",
            },
            {
              question: "Do you have official fee payment receipts?",
              answer: application.feeReceipts,
              answerType: "String",
            },
            {
              question: "Enter the total amount of tuition fees paid (€)",
              answer: application.totalTuitionFees,
              answerType: "Number",
            },
          ],
        },
        {
          category: "Rent Tax Credit",
          questions: [
            {
              question:
                "Have you paid rent for private accommodation in Ireland?",
              answer: application.paidRent,
              answerType: "String",
            },
            {
              question: "Is your tenancy registered with the RTB?",
              answer: application.registeredRTB,
              answerType: "String",
            },
            {
              question: "Enter RTB registration number",
              answer: application.rtbRegistrationNumber,
              answerType: "String",
            },
            {
              question: "Select tenancy start date",
              answer: application.tenancyStartDate,
              answerType: "Date",
            },
            {
              question: "Select tenancy end date",
              answer: application.tenancyEndDate,
              answerType: "Date",
            },
            {
              question: "Enter landlord’s full name",
              answer: application.landlordName,
              answerType: "String",
            },
            {
              question: "Enter property address with Eircode",
              answer: application.propertyAddress,
              answerType: "String",
            },
          ],
        },
        {
          category: "Remote Working Tax Credit",
          questions: [
            {
              question:
                "Have you worked from home for at least 30% of your working days?",
              answer: application.remoteWorking,
              answerType: "String",
            },
            {
              question:
                "Have you paid for home office expenses (electricity, broadband, heating)?",
              answer: application.homeOfficeExpenses,
              answerType: "String",
            },
            {
              question:
                "Do you have receipts or employer confirmation for these expenses?",
              answer: application.expenseReceipts,
              answerType: "String",
            },
          ],
        },
        {
          category: "Flat Rate Expenses",
          questions: [
            {
              question: "Profession",
              answer: application.profession,
              answerType: "String",
            },
            {
              question:
                "Do you work in a profession eligible for flat rate expenses?",
              answer: application.flatRateExpenses,
              answerType: "String",
            },
          ],
        },
        {
          category: "Mortgage Interest Relief",
          questions: [
            {
              question: "Did you take out a mortgage before 2022?",
              answer: application.mortgageBefore2022,
              answerType: "String",
            },
            {
              question:
                "Is there a remaining balance between €80,000 and €500,000?",
              answer: application.remainingBalance,
              answerType: "String",
            },
            {
              question:
                "Are you paying more interest in 2023 and 2024 compared to 2022?",
              answer: application.additionalInterest,
              answerType: "String",
            },
            {
              question: "Enter the additional interest paid (€)",
              answer: application.additionalInterestPaid,
              answerType: "Number",
            },
            {
              question: "Are you still repaying the mortgage?",
              answer: application.stillRepaying,
              answerType: "String",
            },
          ],
        },
      ];
      // Validation
      for (const category of allQuestionAnswers) {
        for (const question of category.questions) {
          if (
            question.answer === null ||
            question.answer === undefined ||
            question.answer === ""
          ) {
            continue; // Skip validation for empty fields
          }
          if (
            question.answerType === "String" &&
            (!question.answer || question.answer.trim() === "")
          ) {
            this.$snackbar.showError(
              `Please provide a valid answer for "${question.question}"`
            );
            return;
          }
          if (
            question.answerType === "Number" &&
            (isNaN(question.answer) || question.answer === null)
          ) {
            this.$snackbar.showError(
              `Please provide a valid number for "${question.question}"`
            );
            return;
          }
          if (question.answerType === "Date" && !question.answer) {
            this.$snackbar.showError(
              `Please provide a valid date for "${question.question}"`
            );
            return;
          }
        }
      }
      this.appLoading = true;
      axios({
        url: `/user/application/submit-questionnaire`,
        method: "POST",
        data: { id, allQuestionAnswers },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            try {
              if (
                this.$snackbar &&
                typeof this.$snackbar.showApiSuccess === "function"
              ) {
                this.$snackbar.showApiSuccess(response.data);
              } else {
                this.$snackbar.showSuccess(response.data.message || "");
              }
            } catch (e) {
              this.$snackbar.showSuccess(response.data.message || "");
            }
            // application.stepperStep = 3;
            this.getApplicationData();
          } else {
            try {
              if (
                this.$snackbar &&
                typeof this.$snackbar.showApiError === "function"
              ) {
                this.$snackbar.showApiError(response.data);
              } else {
                this.$snackbar.showError(response.data.message || "");
              }
            } catch (e) {
              this.$snackbar.showError(response.data.message || "");
            }
          }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.$snackbar.showError(
                "A server error occurred. Please try again later."
              );
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              try {
                if (
                  this.$snackbar &&
                  typeof this.$snackbar.showApiError === "function"
                ) {
                  this.$snackbar.showApiError(err);
                } else {
                  this.$snackbar.showError(err.response?.data?.message || "");
                }
              } catch (e) {
                this.$snackbar.showError(err.response?.data?.message || "");
              }
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.$snackbar.showError(
              "An unexpected error occurred. Please try again."
            );
          }
        });
    },
    newClaim() {
      if (!this.claimyear) {
        this.$snackbar.showError("Please Select Claim Year");
        return;
      }
      this.appLoading = true;
      axios({
        url: "/user/application/apply",
        method: "POST",
        data: {
          year: this.claimyear,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            try {
              if (
                this.$snackbar &&
                typeof this.$snackbar.showApiSuccess === "function"
              ) {
                this.$snackbar.showApiSuccess(response.data);
              } else {
                this.$snackbar.showSuccess(response.data.message || "");
              }
            } catch (e) {
              this.$snackbar.showSuccess(response.data.message || "");
            }
            this.claimyear = null;
            this.dialog = false;
            this.appLoading = false;
            this.getApplicationData();
            this.getData();
          } else {
            try {
              if (
                this.$snackbar &&
                typeof this.$snackbar.showApiError === "function"
              ) {
                this.$snackbar.showApiError(response.data);
              } else {
                this.$snackbar.showError(response.data.message || "");
              }
            } catch (e) {
              this.$snackbar.showError(response.data.message || "");
            }
            this.appLoading = false;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.$snackbar.showError(
                "A server error occurred. Please try again later."
              );
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              try {
                if (
                  this.$snackbar &&
                  typeof this.$snackbar.showApiError === "function"
                ) {
                  this.$snackbar.showApiError(err);
                } else {
                  this.$snackbar.showError(err.response.data.message || "");
                }
              } catch (e) {
                this.$snackbar.showError(err.response?.data?.message || "");
              }
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.$snackbar.showError(
              "An unexpected error occurred. Please try again."
            );
          }
        });
    },
    triggerFileInput(applicationId) {
      const fileInput = this.$refs[`fileInput-${applicationId}`];
      if (fileInput && fileInput[0]) {
        fileInput[0].click();
      }
    },
    generateYears() {
      const currentYear = new Date().getFullYear();
      this.claimyearList = Array.from({ length: 5 }, (_, i) => currentYear - i); // Generate years from current year to 5 years back
    },
    formatDate(item) {
      var dt = new Date(item);
      var day = dt.getDate();
      var year = dt.getFullYear();
      var hours = dt.getHours();
      var minutes = dt.getMinutes();
      dt = dt.toString();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      day = day < 10 ? "0" + day : day;
      var strTime =
        day +
        " " +
        dt.slice(4, 7) +
        " " +
        year +
        " " +
        hours +
        ":" +
        minutes +
        " " +
        ampm;
      return strTime;
    },
    uploadDoc(event, applicationId) {
      const file = event.target.files[0];
      if (file) {
        // Ensure reactive update by using Vue.set or this.$set
        if (!this.applicationDocuments[applicationId]) {
          this.$set(this.applicationDocuments, applicationId, {});
        }

        this.$set(this.applicationDocuments[applicationId], "file", file);
        this.$set(
          this.applicationDocuments[applicationId],
          "fileName",
          file.name
        );

        // Force a reactive update
        this.applicationDocuments = { ...this.applicationDocuments };
      }
    },
    // initializeApplicationDocument(applicationId) {
    //   if (!this.applicationDocuments[applicationId]) {
    //     this.$set(this.applicationDocuments, applicationId, {
    //       file: null,
    //       fileName: null,
    //       category: null,
    //     });
    //   }
    // },
    initializeApplicationDocument(applicationId) {
      if (!this.applicationDocuments[applicationId]) {
        this.$set(this.applicationDocuments, applicationId, {
          file: null,
          fileName: null,
          category: null,
        });
      }
      if (!this.menu[applicationId]) {
        this.$set(this.menu, applicationId, {
          dependentDOB: false,
          tenancyStartDate: false,
          tenancyEndDate: false,
        });
      }
    },
    redirectToDetails() {
      this.$router.push({ path: "/profile-details" }); // Replace 'DetailsPage' with your desired route name
    },
    getStepColor(application, step) {
      return application.stepperStep > step ? "#C6FA8E" : "#043A82";
    },
    verifydocumentupload(application) {
      const applicationId = application._id;
      const documentInfo = this.applicationDocuments[applicationId] || {};
      if (!documentInfo.category) {
        const m = "Please Select Document Category";
        this.$snackbar.showError(m);
        return;
      }
      if (!documentInfo.file) {
        const m = "Please Upload Document";
        this.$snackbar.showError(m);
        return;
      }
      this.uploadDocument(applicationId, documentInfo);
    },
    uploadDocument(applicationId, documentInfo) {
      this.appLoading = true;
      let formData = new FormData();
      formData.append("documentCategoryId", documentInfo.category);
      formData.append("file", documentInfo.file);
      // formData.append("file", this.file);
      formData.append("id", applicationId);
      axios({
        url: "/user/application/upload-document",
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
      })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            const m =
              response.data.message || "Document uploaded successfully.";
            this.$snackbar.showSuccess(m);
            this.documentcategory = null;
            this.file = null;
            this.uploadedFileName = null;
            this.appLoading = false;
            this.$set(this.applicationDocuments, applicationId, {});
            this.getApplicationData();
          } else {
            try {
              if (
                this.$snackbar &&
                typeof this.$snackbar.showApiError === "function"
              ) {
                this.$snackbar.showApiError(response.data);
              } else {
                this.$snackbar.showError(response.data.message || "");
              }
            } catch (e) {
              this.$snackbar.showError(response.data.message || "");
            }
            this.appLoading = false;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response?.data?.message || "";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          try {
            if (
              this.$snackbar &&
              typeof this.$snackbar.showApiError === "function"
            ) {
              this.$snackbar.showApiError({ message: this.msg });
            } else {
              this.$snackbar.showError(this.msg || "");
            }
          } catch (e) {
            this.$snackbar.showError(this.msg || "");
          }
        });
    },
    async getData() {
      try {
        // Using new standardized endpoint with ApiMigrationMixin
        const response = await this.fetchData("/users/profile");
        // Updated to handle new API response structure where user data is nested under 'user'
        this.userData = response.data.user;
        this.name = this.userData.name; // Changed from fullName to name based on new API response
        this.email = this.userData.email;
        this.phone = this.userData.phone;
        this.dob = this.userData.dob;
        // Update maritalStatus for each application
        this.applicationData.forEach((application) => {
          application.maritalStatus = this.userData.maritalStatus;
          application.profession = this.userData.profession;
        });
      } catch (error) {
        // Error handling done automatically by ApiMigrationMixin
        console.error("Failed to load profile data:", error);
      }
    },
    getApplicationData() {
      this.appLoading = true;
      axios({
        method: "GET",
        url: "/user/application/list",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
        params: {
          limit: this.limit,
          page: this.currentPage,
        },
      })
        .then((response) => {
          this.appLoading = false;
          this.pages = Math.ceil(response.data.data.total / this.limit);
          this.applicationData = response.data.data.applications.map(
            (application) => ({
              ...application,
              stepperStep: this.getInitialStep(
                application.status,
                application.isQuestionnaireSubmitted
              ),
            })
          );
          this.applicationData.forEach((application) => {
            this.initializeApplicationDocument(application._id);
          });
          // this.applicationData = response.data.data.applications;
          // this.amountDetails = this.applicationData[0];
          // this.files = this.applicationData[0].documents;
          // this.applicationstatus = response.data.data.applications[0].status;
          // if (this.applicationstatus === "DOCUMENTS_UPLOADED") {
          //   this.e1 = 2;
          // } else if (this.applicationstatus === "PROCESSING") {
          //   this.e1 = 3;
          // } else if (this.applicationstatus === "APPROVED") {
          //   this.e1 = 4;
          // }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 422) {
              // Handle validation error
              this.ServerError = false;
              this.msg = err.response?.data?.message || "";
            } else if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors
              this.ServerError = true;
              this.msg = "An unexpected error occurred. Please try again.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
        });
    },
    getInitialStep(status, isQuestionnaireSubmitted) {
      if (status === "SUBMITTED" && !isQuestionnaireSubmitted) {
        return 2;
      }
      if (
        (status === "SUBMITTED" && isQuestionnaireSubmitted) ||
        status === "DOCUMENTS_UPLOADED"
      ) {
        return 3;
      }
      if (status === "PROCESSING") {
        return 4;
      }
      if (status === "APPROVED") {
        return 5;
      }
      return 2; // Default step
    },
    getDocumentCategoryData() {
      this.appLoading = true;
      axios({
        method: "GET",
        url: "/user/document-category/list",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
        params: {},
      })
        .then((response) => {
          this.appLoading = false;
          this.documentcategorylist = response.data.data.documentCategories;
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 422) {
              // Handle validation error
              this.ServerError = false;
              this.msg = err.response?.data?.message || "";
            } else if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors
              this.ServerError = true;
              this.msg = "An unexpected error occurred. Please try again.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
        });
    },
  },
};
</script>
  <style scoped>
.profilehead {
  font-family: DMSans;
  font-weight: 400;
  font-size: 20px;
}

.profilename {
  font-family: DMSans;
  font-weight: 700;
  font-size: 20px;
  text-transform: capitalize;
  color: rgba(28, 103, 201, 1);
}

.myprofile {
  font-family: DMSans;
  font-weight: 700;
  font-size: 23px;
  color: rgba(0, 0, 0, 1);
}

.subdata {
  color: rgba(30, 111, 235, 1);
  font-family: DMSans;
  font-weight: 700;
  font-size: 18px;
}

.subsubdata {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
  color: rgba(26, 26, 26, 1);
}

.status {
  font-family: DMSans;
  font-weight: 400;
  font-size: 17px;
  text-transform: uppercase;
}

.statuschange {
  font-family: DMSans;
  font-weight: 700;
  font-size: 18px;
  color: #f19d20;
  text-transform: capitalize;
}

.stephead {
  font-family: DMSans;
  font-weight: 500;
  font-size: 16px;
}
/* @media (max-width: 600px) {
    .stephead {
      font-size: 10px;
    }
  } */

.commission {
  font-family: DMSans;
  font-weight: 500;
  font-size: 18px;
  color: #000000;
}
@media (max-width: 600px) {
  .commission {
    font-family: DMSans;
    font-weight: 500;
    font-size: 16px;
    color: #000000;
  }
}

.commissionvalue {
  font-family: poppinsregular;
  font-weight: 400;
  font-size: 18px;
  color: #000000;
}
@media (max-width: 600px) {
  .commissionvalue {
    font-family: poppinsregular;
    font-weight: 400;
    font-size: 16px;
    color: #000000;
  }
}
.status-badge {
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
}
</style>

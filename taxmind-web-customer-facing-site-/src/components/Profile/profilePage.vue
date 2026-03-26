<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <!-- Global snackbar mounted in App.vue - use this.$snackbar.showSuccess()/showError() -->
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12>
        <WelcomeHeader />
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center pt-3>
      <v-flex xs12>
        <v-layout wrap justify-center style="background-color: #f1f7ff" elevation="0">
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
                              <v-img src="../../assets/images/profileicon.webp" contain width="100px" alt="profileicon"
                                height="100px"></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm10>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-left align-self-center>
                                  <span style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    ">{{ userData.name }}</span>
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">PPS Number</span><br />
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
                      <v-layout justify-center v-if="userData && userData.spouseDetails" pt-4>
                        <v-flex xs12>
                          <v-layout wrap justify-center>
                            <v-flex xs12 lg2 md2 sm2>
                              <v-img src="../../assets/images/profileiconfemale.webp" contain width="100px"
                                alt="profileiconfemale" height="100px"></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm10>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-left align-self-center>
                                  <span style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    ">{{ userData.spouseDetails.name }}</span>
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm4>
                                      <span class="subdata">PPS Number</span><br />
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
                              <v-img src="../../assets/images/profileicon.webp" contain width="100px" alt="profileicon"
                                height="100px"></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm12>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-center align-self-center>
                                  <span style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    ">{{ userData.name }}</span>
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm3>
                                      <span class="subdata">PPS Number</span><br />
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
                      <v-layout justify-center v-if="userData && userData.spouseDetails" pt-4>
                        <v-flex xs12>
                          <v-layout wrap justify-center>
                            <v-flex xs4 lg2 md2 sm2>
                              <v-img src="../../assets/images/profileiconfemale.webp" contain width="100px"
                                alt="profileiconfemale" height="100px"></v-img>
                            </v-flex>
                            <v-flex xs12 lg10 md10 sm12>
                              <v-layout wrap justify-center>
                                <v-flex xs12 text-center align-self-center>
                                  <span style="
                                      font-family: DMSans;
                                      font-weight: 500;
                                      font-size: 23px;
                                      text-transform: capitalize;
                                    ">{{ userData.spouseDetails.name }}</span>
                                </v-flex>
                                <v-flex xs12 align-self-center>
                                  <v-layout wrap justify-center>
                                    <v-flex xs12 lg4 md4 sm3>
                                      <span class="subdata">PPS Number</span><br />
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
                      <v-layout wrap justify-end align-center>
                        <v-flex xs12 sm6 md6 text-sm-left text-end>
                          <!-- <v-btn text color="error" @click="openDeleteDialog" class="delete-account-btn">
                            <v-icon left>mdi-delete-outline</v-icon>
                            <span style="
                                font-family: DMSans;
                                font-weight: 500;
                                font-size: 16px;
                              ">Delete Account</span>
                          </v-btn> -->
                        </v-flex>
                        <v-flex xs12 sm6 md6 text-end>
                          <span @click="redirectToDetails">
                            <!-- <v-icon color="#1157B3" medium>mdi-eye</v-icon> -->
                            <span style="
                                font-family: DMSans;
                                font-weight: 400;
                                font-size: 18px;
                                color: #1157b3;
                                cursor: pointer;
                              ">View Details</span></span>
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
    <!-- <v-layout wrap justify-center pt-3 v-if="applicationData.length > 0">
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
                &nbsp;
                <v-btn
                  icon
                  color="#1A73E9"
                  v-if="application && application.isQuestionnaireSubmitted"
                  @click="viewQuestionnaireData(application._id)"
                >
                  <v-icon>mdi-forum</v-icon>
                </v-btn>
                &nbsp;
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
                              v-bind="attrs"
                              v-on="on"
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
                              v-bind="attrs"
                              v-on="on"
                            >
                              <span class="stephead"
                                >Initial Review & Enquiry</span
                              >
                            </v-stepper-step>

                            <v-divider></v-divider>

                            <v-stepper-step
                              :complete="application.stepperStep > 3"
                              step="3"
                              :color="getStepColor(application, 3)"
                              v-bind="attrs"
                              v-on="on"
                            >
                              <span class="stephead">Document Upload</span>
                            </v-stepper-step>

                            <v-divider></v-divider>

                            <v-stepper-step
                              :complete="application.stepperStep > 4"
                              step="4"
                              :color="getStepColor(application, 4)"
                              v-bind="attrs"
                              v-on="on"
                            >
                              <span class="stephead">Review & Processing</span>
                            </v-stepper-step>

                            <v-divider></v-divider>

                            <v-stepper-step
                              step="5"
                              :complete="application.stepperStep > 5"
                              :color="getStepColor(application, 5)"
                              v-bind="attrs"
                              v-on="on"
                            >
                              <span class="stephead">Refund</span>
                            </v-stepper-step>
                          </v-stepper-header>
                          <div
                            class="mobile-step-label"
                            v-if="$vuetify.breakpoint.smAndDown"
                          >
                            <span class="current-step-text">
                              {{ getCurrentStepLabel(application.stepperStep) }}
                            </span>
                          </div>
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
                              >
                                <v-flex xs12>
                                  <v-btn
                                    color="primary"
                                    @click="
                                      openQuestionnaireDialog(application)
                                    "
                                    class="mt-3 questionnaire-button"
                                  >
                                    Continue to Questionnaire
                                  </v-btn>
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
                                                <v-btn
                                                  download
                                                  small
                                                  plain
                                                  :href="fileURL + file.file"
                                                  target="_blank"
                                                >
                                                  <v-icon color="#1A73E9"
                                                    >mdi-eye</v-icon
                                                  >
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
    </v-layout> -->
    <!-- <v-layout wrap justify-center pt-2>
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
    </v-layout> -->
    <!-- <v-layout
      wrap
      justify-center
      v-if="applicationData && applicationData.length === 0"
    >
      <v-flex xs12 text-center
        ><span style="font-family: DMSans">No Data Found!</span></v-flex
      >
    </v-layout> -->
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title><span style="font-family: DMSans">Start New Claim</span></v-card-title>
        <v-card-text>
          <v-layout wrap justify-center>
            <v-flex xs12>
              <v-layout wrap justify-center>
                <v-flex xs12 text-left>
                  <span style="font-family: DMSans; font-size: 18px; color: black">Claim Year</span>
                  <v-select v-model="claimyear" class="rounded-lg pt-1" solo dense :items="claimyearList" outlined flat
                    hide-details style="font-family: DMSans">
                  </v-select>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialog = false" style="font-family: DMSans">Close</v-btn>
          <v-btn color="success" @click="newClaim()" style="font-family: DMSans">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="questionnaireDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="headline" style="font-family: DMSans">
          Tax Credit Eligibility Questionnaire
        </v-card-title>
        <v-card-text>
          <v-container>
            <!-- Move your existing questionnaire form here -->
            <v-form v-if="activeApplication">
              <v-layout wrap justify-center>
                <v-flex xs12>
                  <v-layout wrap justify-start>
                    <!-- Home Carer Tax Credit -->
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">1. Home Carer Tax Credit</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <v-select v-model="activeApplication.maritalStatus" :items="maritalstatuslist" 
                        item-text="text" item-value="value" outlined
                        label="Marital Status">
                      </v-select>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Does your spouse earn less than €10,400 per year?</span>
                      <v-radio-group v-model="activeApplication.spouseEarnings">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Do you care for a dependent child, elderly person, or
                        disabled individual?</span>
                      <v-radio-group v-model="activeApplication.careDependent">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Enter the PPS Number of the dependent child (Format: 7
                        digits + 1 letter)</span>
                      <v-text-field v-model="activeApplication.dependentPPSNumber" label="Enter the PPS Number"
                        outlined></v-text-field>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Select the Date of Birth of the dependent child</span>
                    </v-flex>
                    <v-flex xs12 text-left>
                      <v-menu v-model="menu[activeApplication._id].dependentDOB" :close-on-content-click="false"
                        :nudge-right="40" transition="scale-transition" offset-y min-width="auto">
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field v-model="activeApplication.dependentDOB" label="Select the Date of Birth"
                            append-icon="mdi-calendar" outlined readonly v-bind="attrs" v-on="on"></v-text-field>
                        </template>
                        <v-date-picker v-model="activeApplication.dependentDOB" @input="
                          menu[activeApplication._id].dependentDOB = false
                          "></v-date-picker>
                      </v-menu>
                    </v-flex>
                  </v-layout>
                  <!-- Medical Expenses Tax Credit -->
                  <v-layout wrap justify-center>
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">2. Medical Expenses Tax Credit</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Have you incurred medical or dental expenses not
                        covered by insurance?</span>
                      <v-radio-group v-model="activeApplication.medicalExpenses">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Do you have receipts for these expenses?</span>
                      <v-radio-group v-model="activeApplication.medicalReceipts">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Enter the total amount of medical expenses incurred
                        (€)</span>
                      <v-text-field v-model="activeApplication.totalMedicalExpenses" label="Enter Amount"
                        outlined></v-text-field>
                    </v-flex>
                  </v-layout>
                  <!-- Dependent Relative Tax Credit -->
                  <v-layout wrap justify-center>
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">3. Dependent Relative Tax Credit</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Do you financially support a relative who is unable to
                        support themselves?</span>
                      <v-radio-group v-model="activeApplication.supportRelative">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Select the dependent relative’s relation</span>
                      <v-select v-model="activeApplication.relativeRelation" :items="[
                        'Parent',
                        'Grandparent',
                        'Sibling',
                        'Child Over 18',
                      ]" label="Select" outlined></v-select>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Does their annual income fall below €16,000?</span>
                      <v-radio-group v-model="activeApplication.relativeIncome">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                  </v-layout>
                  <!-- Tuition Fees Tax Credit -->
                  <v-layout wrap justify-center>
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">4. Tuition Fees Tax Credit</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Have you paid tuition fees for a higher education
                        course?</span>
                      <v-radio-group v-model="activeApplication.tuitionFees">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Is the course in an approved Irish or EU
                        institution?</span>
                      <v-radio-group v-model="activeApplication.approvedInstitution">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Do you have official fee payment receipts?</span>
                      <v-radio-group v-model="activeApplication.feeReceipts">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Enter the total amount of tuition fees paid (€)</span>
                      <v-text-field v-model="activeApplication.totalTuitionFees" label="Enter the total amount"
                        outlined></v-text-field>
                    </v-flex>
                  </v-layout>
                  <!-- Rent Tax Credit -->
                  <v-layout wrap justify-center>
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">5. Rent Tax Credit</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Have you paid rent for private accommodation in
                        Ireland?</span>
                      <v-radio-group v-model="activeApplication.paidRent">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Is your tenancy registered with the RTB?</span>
                      <v-radio-group v-model="activeApplication.registeredRTB">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Enter RTB registration number (Format: Alphanumeric,
                        9-12 characters)</span>
                      <v-text-field v-model="activeApplication.rtbRegistrationNumber"
                        label="Enter RTB registration number" outlined></v-text-field>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Select tenancy start date</span>
                    </v-flex>
                    <v-flex xs12 text-left>
                      <v-menu v-model="menu[activeApplication._id].tenancyStartDate" :close-on-content-click="false"
                        :nudge-right="40" transition="scale-transition" offset-y min-width="auto">
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field v-model="activeApplication.tenancyStartDate" label="Start date"
                            append-icon="mdi-calendar" readonly outlined v-bind="attrs" v-on="on"></v-text-field>
                        </template>
                        <v-date-picker v-model="activeApplication.tenancyStartDate" @input="
                          menu[activeApplication._id].tenancyStartDate = false
                          "></v-date-picker>
                      </v-menu>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Select tenancy end date</span>
                    </v-flex>
                    <v-flex xs12 text-left>
                      <v-menu v-model="menu[activeApplication._id].tenancyEndDate" :close-on-content-click="false"
                        :nudge-right="40" transition="scale-transition" offset-y min-width="auto">
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field v-model="activeApplication.tenancyEndDate" label="End date"
                            append-icon="mdi-calendar" readonly outlined v-bind="attrs" v-on="on"></v-text-field>
                        </template>
                        <v-date-picker v-model="activeApplication.tenancyEndDate" @input="
                          menu[activeApplication._id].tenancyEndDate = false
                          "></v-date-picker>
                      </v-menu>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Enter landlord’s full name</span>
                      <v-text-field v-model="activeApplication.landlordName" label="Full Name" outlined></v-text-field>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Enter property address with Eircode (Format: Standard
                        Irish Eircode)</span>
                      <v-text-field v-model="activeApplication.propertyAddress" label="Enter property address"
                        outlined></v-text-field>
                    </v-flex>
                  </v-layout>
                  <!-- Remote Working Tax Credit -->
                  <v-layout wrap justify-center>
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">6. Remote Working Tax Credit</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Have you worked from home for at least 30% of your
                        working days?</span>
                      <v-radio-group v-model="activeApplication.remoteWorking">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Have you paid for home office expenses (electricity,
                        broadband, heating)?</span>
                      <v-radio-group v-model="activeApplication.homeOfficeExpenses">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Do you have receipts or employer confirmation for these
                        expenses?</span>
                      <v-radio-group v-model="activeApplication.expenseReceipts">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                  </v-layout>
                  <!-- Flat Rate Expenses -->
                  <v-layout wrap justify-center>
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">7. Flat Rate Expenses</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <v-text-field v-model="activeApplication.profession" label="Profession" outlined></v-text-field>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span text-left>Do you work in a profession eligible for flat rate
                        expenses?</span>
                      <v-radio-group v-model="activeApplication.flatRateExpenses">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                  </v-layout>
                  <!-- Mortgage Interest Relief -->
                  <v-layout wrap justify-center>
                    <v-flex xs12 pt-2 text-left>
                      <span style="
                          font-family: DMSans;
                          font-weight: 700;
                          font-size: 20px;
                        ">8. Mortgage Interest Relief (for older loans)</span>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Did you take out a mortgage before 2022?</span>
                      <v-radio-group v-model="activeApplication.mortgageBefore2022">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Is there a remaining balance between €80,000 and
                        €500,000?</span>
                      <v-radio-group v-model="activeApplication.remainingBalance">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Are you paying more interest in 2023 and 2024 compared
                        to 2022?</span>
                      <v-radio-group v-model="activeApplication.additionalInterest">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Enter the additional interest paid (€)</span>
                      <v-text-field v-model="activeApplication.additionalInterestPaid"
                        label="Enter the additional interest" outlined></v-text-field>
                    </v-flex>
                    <v-flex xs12 pt-2 text-left>
                      <span>Are you still repaying the mortgage?</span>
                      <v-radio-group v-model="activeApplication.stillRepaying">
                        <v-radio label="Yes" value="yes"></v-radio>
                        <v-radio label="No" value="no"></v-radio>
                      </v-radio-group>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="closeQuestionnaireDialog" style="font-family: DMSans">
            Close
          </v-btn>
          <v-btn color="primary" @click="submitQuestionnaire" style="font-family: DMSans">
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Delete Account Dialog Component -->
    <DeleteAccountDialog v-model="deleteDialog" :userEmail="userData.email" />

    <v-dialog v-model="showQuestionnaireDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="headline" style="font-family: DMSans">
          View Questionnaire Responses
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row v-for="category in questionData.allQuestionAnswers" :key="category.id">
              <v-col cols="12" class="text-left">
                <h3>{{ category.category }}</h3>
                <v-list dense>
                  <v-list-item v-for="question in category.questions" :key="question.id">
                    <v-list-item-content>
                      <v-list-item-title class="text-left">{{
                        question.question
                      }}</v-list-item-title>
                      <v-list-item-subtitle class="text-left">
                        <span v-if="question.answer">
                          <span v-if="question.answerType === 'Date'">
                            {{ formatQuestionDate(question.answer) }}
                          </span>
                          <span v-else>
                            {{ question.answer }}
                          </span>
                        </span>
                        <span v-else>_____________</span>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="showQuestionnaireDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import axios from "axios";
import { ApiMigrationMixin } from "@/utils/apiMigration";
import WelcomeHeader from "../Common/WelcomeHeader.vue";
import DeleteAccountDialog from "../Common/DeleteAccountDialog.vue";

export default {
  mixins: [ApiMigrationMixin],
  components: {
    WelcomeHeader,
    DeleteAccountDialog,
  },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      timeout: 5000,
      msg: null,
      userData: {},
      name: null,
      email: null,
      phone: null,
      ppsNumber: null,
      address: null,
      eircode: null,
      profession: null,
      maritalStatus: null,
      claimyear: null,
      claimyearList: [],
      applicationDocuments: {},
      documentcategory: null,
      applicationstatus: null,
      documentcategorylist: [],
      maritalstatuslist: [
        { text: 'Married', value: 'married' },
        { text: 'Single', value: 'single' },
        { text: 'Civil Partnership', value: 'civil_partnership' },
        { text: 'Widowed', value: 'widowed' },
        { text: 'Separated', value: 'separated' },
        { text: 'Divorced', value: 'divorced' },
        { text: 'Married spouse abroad', value: 'married_spouse_abroad' }
      ],
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
      questionnaireDialog: false, // Add this new property
      activeApplication: null, // Add this to track which application's form to show
      questionData: {},
      showQuestionnaireDialog: false,
      deleteDialog: false,
    };
  },
  beforeMount() {
    // this.getApplicationData();
    this.generateYears();
    this.getData();
    // this.getDocumentCategoryData();
    // setTimeout(() => {
    //   this.getData();
    // }, 1000);
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
    getCurrentStepLabel(step) {
      const labels = {
        1: "Application Submission",
        2: "Initial Review & Enquiry",
        3: "Document Upload",
        4: "Review & Processing",
        5: "Refund",
      };
      return labels[step] || "";
    },
    viewQuestionnaireData(applicationId) {
      this.appLoading = true;
      axios({
        url: "/user/application/get-questionnaire",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
        params: {
          id: applicationId,
        },
      })
        .then((response) => {
          this.appLoading = false;
          this.questionData = response.data.data;
          this.showQuestionnaireDialog = true;
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
    openQuestionnaireDialog(application) {
      this.activeApplication = application;
      this.questionnaireDialog = true;
    },
    closeQuestionnaireDialog() {
      this.questionnaireDialog = false;
      this.activeApplication = null;
    },
    submitQuestionnaire() {
      if (this.activeApplication) {
        this.submitStepTwo(this.activeApplication);
        this.questionnaireDialog = false;
        this.activeApplication = null;
      }
    },
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
            this.msg = `Please provide a valid answer for "${question.question}"`;
            this.$snackbar.showError(this.msg);
            return;
          }
          if (
            question.answerType === "Number" &&
            (isNaN(question.answer) || question.answer === null)
          ) {
            this.msg = `Please provide a valid number for "${question.question}"`;
            this.$snackbar.showError(this.msg);
            return;
          }
          if (question.answerType === "Date" && !question.answer) {
            this.msg = `Please provide a valid date for "${question.question}"`;
            this.$snackbar.showError(this.msg);
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
            const message = response.data.message || "";
            this.$snackbar.showSuccess(message);
            // application.stepperStep = 3;
            this.getApplicationData();
          } else {
            this.msg = response.data.message;
            this.$snackbar.showError(this.msg);
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
          this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
        });
    },
    async newClaim() {
      if (!this.claimyear) {
        this.msg = "Please Select Claim Year";
        this.$snackbar.showError(this.msg);
        return;
      }

      try {
        // Using new applications endpoint with ApiMigrationMixin
        const response = await this.submitData("/applications", {
          year: this.claimyear,
        });

        if (response.status) {
          const message = response.message || "New Claim Created Successfully";
          this.$snackbar.showSuccess(message);
          this.claimyear = null;
          this.dialog = false;
          this.$router.push({ path: "/application" });
        } else {
          this.msg = response.message;
          this.$snackbar.showError(this.msg);
        }
      } catch (error) {
        // Error handling done automatically by ApiMigrationMixin
        console.error("New claim creation failed:", error);
      }
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
    openDeleteDialog() {
      this.deleteDialog = true;
    },
    getStepColor(application, step) {
      return application.stepperStep > step ? "#C6FA8E" : "#043A82";
    },
    verifydocumentupload(application) {
      const applicationId = application._id;
      const documentInfo = this.applicationDocuments[applicationId] || {};
      if (!documentInfo.category) {
        this.$snackbar.showError("Please Select Document Category");
        return;
      }
      if (!documentInfo.file) {
        this.$snackbar.showError("Please Upload Document");
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
            const message = response.data.message || "";
            this.$snackbar.showSuccess(message);
            this.documentcategory = null;
            this.file = null;
            this.uploadedFileName = null;
            this.appLoading = false;
            this.$set(this.applicationDocuments, applicationId, {});
            this.getApplicationData();
          } else {
            this.msg = response.data.message;
            this.$snackbar.showError(this.msg);
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
          this.$snackbar.showError(this.msg); // Show Snackbar for all error cases
        });
    },
    async getData() {
      try {
        // Using new standardized endpoint with ApiMigrationMixin
        const response = await this.fetchData("/users/profile");

        // Support both response shapes: { data: { user: {...} } } and { data: {...} }
        const u =
          response && response.data && (response.data.user || response.data)
            ? response.data.user || response.data
            : null;
        if (u) {
          // Map spouse data from API key 'spouse' to template key 'spouseDetails'
          if (u.spouse) {
            u.spouseDetails = u.spouse;
          }

          this.userData = u;

          // Map fields to local properties used by the template
          this.name = u.name || "";
          this.email = u.email || "";
          this.phone = u.phone || u.phoneNumber || "";
          this.dob = u.dob || "";
          this.ppsNumber = u.ppsNumber || u.ppsNo || "";
          this.address = u.address || "";
          this.eircode = u.eircode || "";
          this.profession = u.profession || "";
          this.maritalStatus = u.maritalStatus || "";

          // Populate applicationData fields that rely on profile values
          this.applicationData.forEach((application) => {
            application.maritalStatus = this.maritalStatus;
            application.profession = this.profession;
          });
        }
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
    formatQuestionDate(item) {
      const date = new Date(item);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
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

.mobile-step-label {
  display: none;
  text-align: center;
  padding: 8px;
  margin-top: 8px;
  background-color: #f1f7ff;
  border-radius: 4px;
}

.current-step-text {
  font-family: DMSans;
  font-weight: 700;
  text-decoration: underline;
  font-size: 14px;
  color: #043a82;
}

/* Change media query to include both xs and sm screens */
@media (max-width: 959px) {

  /* This covers both xs and sm breakpoints in Vuetify */
  .mobile-step-label {
    display: block;
  }

  .stephead {
    font-size: 12px;
  }

  .v-stepper__step {
    padding: 8px !important;
  }
}

/* Keep this media query for very small screens */
@media (max-width: 360px) {
  .stephead {
    font-size: 10px;
  }
}

.v-tooltip__content {
  background-color: #043a82 !important;
  color: white !important;
  font-family: DMSans !important;
  font-size: 14px !important;
  padding: 6px 12px !important;
  border-radius: 4px !important;
}

.v-stepper__step {
  cursor: pointer;
}

.questionnaire-button {
  font-family: DMSans;
  font-weight: 500;
}

@media (max-width: 600px) {
  .questionnaire-button {
    font-size: 10px;
  }
}

.delete-account-btn {
  font-family: DMSans;
  text-transform: none;
  /* background-color: #f15120;
  color: white; */
  border: 1px solid red;
}

.delete-account-btn:hover {
  background-color: rgba(211, 47, 47, 0.08);
}
</style>

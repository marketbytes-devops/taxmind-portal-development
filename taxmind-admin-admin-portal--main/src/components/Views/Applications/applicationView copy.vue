<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="#1A73E9" right :timeout="timeout">
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

    <v-layout wrap justify-center pb-16>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">
          <v-flex xs12 sm6 md8 lg8 text-start align-center pt-2 class="carousalhead">Application Details
          </v-flex>
        </v-layout>

        <v-layout wrap justify-start>
          <v-flex xs12>
            <v-layout wrap justify-center>
              <v-flex xs12 sm12 md12 lg12>
                <v-card class="pa-8 pt-10" outlined color="white">
                  <v-layout wrap justify-start px-4 pt-4>
                    <v-flex xs12 pb-4>
                      <v-layout wrap justify-center>
                        <v-flex xs12 text-start>
                          <span style="
                              color: black;
                              font-family: DMSans;
                              font-size: 18px;
                            ">APPLICATION NO:
                            {{ applicantdata.applicationId }}</span>
                        </v-flex>
                        <v-flex xs12 text-start>
                          <span style="
                              color: #f19d20;
                              font-family: DMSans;
                              font-size: 18px;
                            ">STATUS: {{ applicantdata.status }}</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Name</span>
                      <br />
                      <span v-if="userData.fullName">{{
                        userData.fullName
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Email</span>
                      <br />
                      <span v-if="userData.email">{{ userData.email }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Phone Number</span>
                      <br />
                      <span v-if="userData.phone">{{ userData.phone }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Date Of Birth</span>
                      <br />
                      <span v-if="userData.dob">{{
                        formattedDateOfBirth
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Profession</span>
                      <br />
                      <span v-if="userData.profession">{{
                        userData.profession
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">PPS Number</span>
                      <br />
                      <span v-if="userData.ppsNumber">{{
                        userData.ppsNumber
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Eircode</span>
                      <br />
                      <span v-if="userData.eircode">{{
                        userData.eircode
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Address</span>
                      <br />
                      <span v-if="userData.address">{{
                        userData.address
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start px-4 pt-4>
                    <!-- Headings Row -->
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Marital Status</span>
                      <br />
                      <span v-if="userData.maritalStatus">{{
                        userData.maritalStatus
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">PDF</span>
                      <br />
                      <span>
                        <a target="_blank" :href="ipURL +
                          '/v1/admin/user/download-pdf?id=' +
                          userData._id
                          " class="downlink">
                          <span><v-icon color="red">mdi-file-pdf-box</v-icon>
                            Download</span>
                        </a>
                      </span>
                    </v-flex>
                    <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                      <span style="
                          color: black;
                          font-family: opensansbold;
                          font-size: 15px;
                        ">Submitted On</span>
                      <br />
                      <span v-if="applicantdata.create_date">{{
                        formatDate(applicantdata.create_date)
                        }}</span>
                      <span v-else>_____________</span>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4 v-if="userData.maritalStatus == 'Married'">
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Spouse Details</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Full Name</span>
                          <br />
                          <span v-if="spouseData.fullName">{{
                            spouseData.fullName
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Email</span>
                          <br />
                          <span v-if="spouseData.email">{{
                            spouseData.email
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Phone Number</span>
                          <br />
                          <span v-if="spouseData.phone">{{
                            spouseData.phone
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Date Of Birth</span>
                          <br />
                          <span v-if="spouseData.dob">{{
                            formattedspouseDateOfBirth
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Profession</span>
                          <br />
                          <span v-if="spouseData.profession">{{
                            spouseData.profession
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">PPS Number</span>
                          <br />
                          <span v-if="spouseData.ppsNumber">{{
                            spouseData.ppsNumber
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Eircode</span>
                          <br />
                          <span v-if="spouseData.eircode">{{
                            spouseData.eircode
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Address</span>
                          <br />
                          <span v-if="spouseData.address">{{
                            spouseData.address
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">PDF</span>
                          <br />
                          <span>
                            <a target="_blank" :href="ipURL +
                              '/v1/admin/user/download-pdf?id=' +
                              userData._id +
                              '&type=' +
                              'Spouse'
                              " class="downlink">
                              <span><v-icon color="red">mdi-file-pdf-box</v-icon>
                                Download</span>
                            </a>
                          </span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4 v-if="
                    applicantdata &&
                    applicantdata.statusHistory &&
                    applicantdata.statusHistory.length > 0
                  ">
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Application Timeline</span>
                        </v-flex>
                        <v-flex xs12>
                          <v-layout wrap justify-center>
                            <v-flex xs12 sm12 md12 lg12>
                              <v-card class="pa-8 pt-10" outlined color="white">
                                <v-layout wrap justify-start px-4 pt-4>
                                  <v-flex xs12>
                                    <v-timeline dense>
                                      <v-timeline-item small v-for="(
item, index
                                        ) in applicantdata.statusHistory" :key="index">
                                        <div style="
                                            color: black;
                                            font-family: opensansbold;
                                            font-size: 15px;
                                          ">
                                          {{ item.status }}
                                        </div>
                                        <div>
                                          {{ formatDate(item.updatedAt) }}
                                        </div>
                                      </v-timeline-item>
                                    </v-timeline>
                                  </v-flex>
                                </v-layout>
                              </v-card>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4>
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Documents</span>
                          &nbsp;<v-btn v-if="
                            applicantdata &&
                            applicantdata.isQuestionnaireSubmitted
                          " dark color="#1A73E9" class="rounded-lg carousaladdedit"
                            @click="showQuestionnaireDialog = true">Questionnaire</v-btn>
                        </v-flex>
                        <v-flex xs12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 16px;
                            ">Year : {{ applicantdata.year }}</span>
                        </v-flex>
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <v-layout wrap justify-start pt-2 pb-2 v-if="files && files.length > 0">
                            <v-flex xs12 lg7 py-2 v-for="(file, index) in files" :key="index">
                              <v-card rounded="lg" flat style="background-color: #f1f7ff">
                                <v-layout wrap justify-center pa-5>
                                  <v-flex xs11 lg10 md10 sm6>
                                    <v-layout wrap justify-center>
                                      <v-flex xs12>
                                        <span style="
                                            font-family: DMSans;
                                            font-weight: 400;
                                            font-size: 18px;
                                            color: #1c1c1c;
                                          ">{{ file.categoryId.name }}</span>
                                      </v-flex>
                                      <v-flex xs12>
                                        <span style="
                                            font-family: DMSans;
                                            font-weight: 400;
                                            font-size: 18px;
                                            color: #000000;
                                            color: #1c1c1c;
                                          ">{{ file.originalFileName }}</span>
                                      </v-flex>
                                      <v-flex xs12>
                                        <span style="
                                            font-family: DMSans;
                                            font-weight: 400;
                                            font-size: 14px;
                                            color: #1c1c1c;
                                          ">{{
                                            formatDate(file.uploadDate)
                                          }}</span>
                                      </v-flex>
                                    </v-layout>
                                  </v-flex>
                                  <v-flex xs1 sm6 md12 lg2 text-right align-self-center>
                                    <v-layout wrap justify-center>
                                      <v-flex xs12 align-self-center>
                                        <v-btn plain class="bgcustom" dark download :href="fileURL + file.file"
                                          target="_blank">
                                          <v-icon color="#1C1C1C">mdi-download</v-icon></v-btn>
                                      </v-flex>
                                    </v-layout>
                                  </v-flex>
                                </v-layout>
                              </v-card>
                            </v-flex>
                          </v-layout>
                          <v-layout wrap justify-center pt-2 pb-2 v-else>
                            <v-flex xs12 text-center>
                              No Documents Uploaded!
                            </v-flex>
                            <v-flex xs12 text-center v-if="
                              applicantdata &&
                              applicantdata.isNoDocumentToUpload
                            ">
                              <span style="color: red">Note: There was no documents to be uploaded
                                !!</span>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4 v-if="applicantdata.status === 'APPROVED'">
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Amount Details</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Refund Amount</span>
                          <br />
                          <span v-if="applicantdata.refundAmount">{{ applicantdata.refundAmount }}€</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Commission Amount</span>
                          <br />
                          <span v-if="applicantdata.commissionAmount">{{
                            applicantdata.commissionAmount.toFixed(2)
                          }}€</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Commission Percentage</span>
                          <br />
                          <span v-if="applicantdata.commissionPercentage">{{ applicantdata.commissionPercentage
                            }}%</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Total Commission Amount</span>
                          <br />
                          <span v-if="applicantdata.totalCommissionAmount">{{
                            applicantdata.totalCommissionAmount.toFixed(2)
                          }}€</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">VAT Amount</span>
                          <br />
                          <span v-if="applicantdata.vatAmount">{{ applicantdata.vatAmount.toFixed(2) }}€</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">VAT Percentage</span>
                          <br />
                          <span v-if="applicantdata.vatPercentage">{{ applicantdata.vatPercentage }}%</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                          <span style="
                              color: red;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Discount Amount</span>
                          <br />
                          <span v-if="applicantdata.discountAmount" style="color: red">{{ applicantdata.discountAmount
                            }}€</span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm6 md3 lg3 xl3 text-left v-if="applicantdata && applicantdata.invoiceId">
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Invoice Number</span>
                          <br />
                          <span v-if="applicantdata.invoiceId">{{
                            applicantdata.invoiceId
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4 v-if="
                    applicantdata.status === 'APPROVED' && applicationreview
                  ">
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Review Details</span>
                        </v-flex>
                        <v-flex xs12 text-start pt-4>
                          <span style="
                              color: #f19d20;
                              font-family: DMSans;
                              font-size: 18px;
                            ">STATUS: {{ applicationreview.status }}</span>
                        </v-flex>
                      </v-layout>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md3 lg3 xl3 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Rating</span>
                          <br />
                          <span v-if="applicationreview.rating">
                            <v-rating v-model="applicationreview.rating" color="warning lighten-1"
                              background-color="#1A73E9" empty-icon="$ratingFull" hover large readonly></v-rating>
                          </span>
                          <span v-else>_____________</span>
                        </v-flex>
                        <v-flex xs12 sm12 md9 lg9 xl9 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 15px;
                            ">Review</span>
                          <br />
                          <span v-if="applicationreview.review">{{
                            applicationreview.review
                            }}</span>
                          <span v-else>_____________</span>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-start pt-4 v-if="
                    (files &&
                      files.length > 0 &&
                      applicantdata.status != 'APPROVED') ||
                    (files &&
                      files.length == 0 &&
                      applicantdata.status != 'APPROVED' &&
                      applicantdata.isNoDocumentToUpload)
                  ">
                    <v-flex xs12>
                      <v-layout wrap justify-start px-4 pt-4>
                        <!-- Headings Row -->
                        <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                          <span style="
                              color: black;
                              font-family: opensansbold;
                              font-size: 25px;
                            ">Update Status</span>
                        </v-flex>
                        <v-flex xs12>
                          <v-layout wrap justify-start>
                            <v-flex xs12 sm4>
                              <v-select class="pt-2 text-des rounded-lg" v-model="selectedStatus" :items="statusOptions"
                                label="Select Status" outlined dense color="#1A73E9"></v-select>
                            </v-flex>
                            <v-flex xs12 sm4 pl-lg-2 pl-sm-2 pl-md-2 v-if="selectedStatus == 'APPROVED'">
                              <v-text-field class="pt-2 text-des rounded-lg" v-model="refundamount"
                                label="Enter Refund Amount" required outlined dense prefix="€"
                                :hide-details="true"></v-text-field>
                            </v-flex>
                            <v-flex xs12 sm4 pl-2 v-if="selectedStatus == 'APPROVED'" text-left align-self-center>
                              <span style="
                                  font-family: DMSans;
                                  color: #f19d20;
                                  cursor: pointer;
                                " @click="validatecalculate()">Calculate Now!</span>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                        <v-flex xs12 v-if="calculationData && calculationData.refundAmount">
                          <v-layout wrap justify-start px-4 pt-4>
                            <!-- Headings Row -->
                            <v-flex xs12 sm12 md12 lg12 xl12 text-left>
                              <span style="
                                  color: black;
                                  font-family: opensansbold;
                                  font-size: 25px;
                                ">Amount Details</span>
                            </v-flex>
                          </v-layout>
                          <v-layout wrap justify-start px-4 pt-4>
                            <!-- Headings Row -->
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: black;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">Refund Amount</span>
                              <br />
                              <span v-if="calculationData.refundAmount">{{ calculationData.refundAmount }}/-</span>
                              <span v-else>_____________</span>
                            </v-flex>
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: black;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">Commission Amount</span>
                              <br />
                              <span v-if="calculationData.commissionAmount">{{
                                calculationData.commissionAmount.toFixed(2)
                              }}/-</span>
                              <span v-else>_____________</span>
                            </v-flex>
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: black;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">Commission Percentage</span>
                              <br />
                              <span v-if="calculationData.commissionPercentage">{{
                                calculationData.commissionPercentage
                              }}%</span>
                              <span v-else>_____________</span>
                            </v-flex>
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: black;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">Total Commission Amount</span>
                              <br />
                              <span v-if="calculationData.totalCommissionAmount">{{
                                calculationData.totalCommissionAmount.toFixed(
                                  2
                                )
                              }}/-</span>
                              <span v-else>_____________</span>
                            </v-flex>
                          </v-layout>
                          <v-layout wrap justify-start px-4 pt-4>
                            <!-- Headings Row -->
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: black;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">VAT Amount</span>
                              <br />
                              <span v-if="calculationData.vatAmount">{{
                                calculationData.vatAmount.toFixed(2)
                              }}/-</span>
                              <span v-else>_____________</span>
                            </v-flex>
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: black;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">VAT Percentage</span>
                              <br />
                              <span v-if="calculationData.vatPercentage">{{ calculationData.vatPercentage }}%</span>
                              <span v-else>_____________</span>
                            </v-flex>
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: red;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">Discount Amount</span>
                              <v-text-field dense hide-details="auto" v-model="discount"></v-text-field>
                            </v-flex>
                            <v-flex xs12 sm6 md3 lg3 xl3 text-left>
                              <span style="
                                  color: red;
                                  font-family: opensansbold;
                                  font-size: 15px;
                                ">Final Amount</span>
                              <br />
                              <span v-if="finalAmount" style="color: red">{{ finalAmount.toFixed(2) }}€</span>
                              <span v-else>0 €</span>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                        <v-flex xs12 pt-2>
                          <v-layout wrap justify-start>
                            <v-flex xs12>
                              <v-btn dark color="#1A73E9" @click="validateUpdate()" class="rounded-lg carousaladdedit">
                                <span style="text-transform: none">Save Changes</span>
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
    <v-dialog v-model="showQuestionnaireDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="headline">Questionnaire</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row v-for="category in questionData.allQuestionAnswers" :key="category.id">
              <v-col cols="12">
                <h3>{{ category.category }}</h3>
                <v-list dense>
                  <v-list-item v-for="question in category.questions" :key="question.id">
                    <v-list-item-content>
                      <v-list-item-title>{{
                        question.question
                        }}</v-list-item-title>
                      <v-list-item-subtitle>
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
import http from "@/api/http";
export default {
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      keyword: "",
      usersList: [],
      selectedStatus: null,
      showSnackBar: false,
      timeout: 5000,
      files: [],
      userData: {},
      spouseData: {},
      calculationData: {},
      msg: "",
      appLoading: false,
      itemToDelete: null,
      statusItems: ["PROCESSING", "APPROVED"],
      status: null,
      page: 1,
      currentPage: 1,
      refundamount: null,
      pages: 0,
      accesstokenpdf: localStorage.getItem("token"),
      limit: 10,
      applicantdata: {},
      applicationreview: {},
      discount: 0,
      showQuestionnaireDialog: false,
      questionData: {},
    };
  },
  mounted() {
    this.getData();
    // this.getquestionData();
  },
  computed: {
    formattedDateOfBirth() {
      if (!this.userData.dob) return "_____________";
      const date = new Date(this.userData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    finalAmount() {
      const totalCommissionAmount =
        this.calculationData.totalCommissionAmount || 0;
      const discount = this.discount || 0;
      return totalCommissionAmount - discount;
    },
    formattedspouseDateOfBirth() {
      if (!this.spouseData.dob) return "_____________";
      const date = new Date(this.spouseData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
  },
  watch: {
    discount(newDiscount) {
      const totalCommissionAmount =
        this.calculationData.totalCommissionAmount || 0;
      if (newDiscount > totalCommissionAmount) {
        this.msg =
          "Discount amount cannot be greater than the total commission amount.";
        this.showSnackBar = true;
        this.discount = totalCommissionAmount; // Reset discount to maximum allowable value
      }
    },
  },
  methods: {
    updateStatusOptions() {
      if (this.backendStatus === "DOCUMENTS_UPLOADED") {
        this.statusOptions = ["PROCESSING"];
      } else if (this.backendStatus === "PROCESSING") {
        this.statusOptions = ["APPROVED"];
      } else {
        this.statusOptions = ["PROCESSING", "APPROVED"];
      }
    },
    getData() {
      this.appLoading = true;
      axios({
        url: "/v1/admin/application/get",
        method: "GET",
        headers: {
          "authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        params: {
          id: this.$route.query.id,
        },
      })
        .then((response) => {
          this.appLoading = false;
          this.applicantdata = response.data.data.application;
          this.backendStatus = this.applicantdata.status;
          this.updateStatusOptions();
          this.userData = response.data.data.application.uid;
          this.spouseData = this.userData.spouseDetails;
          this.files = this.applicantdata.documents;
          this.applicationreview = response.data.data.applicationReview;
          if (this.applicantdata.isQuestionnaireSubmitted) {
            this.getquestionData();
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
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    getquestionData() {
      this.appLoading = true;
      axios({
        url: "/v1/admin/application/get-questionnaire",
        method: "GET",
        headers: {
          "authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        params: {
          id: this.$route.query.id,
        },
      })
        .then((response) => {
          this.appLoading = false;
          this.questionData = response.data.data;
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
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    validateUpdate() {
      if (!this.selectedStatus) {
        this.msg = "Please Select Status";
        this.showSnackBar = true;
        return;
      } else if (this.selectedStatus === "APPROVED" && !this.refundamount) {
        this.msg = "Please Enter Refund Amount";
        this.showSnackBar = true;
        return;
      } else {
        this.updateStatus();
      }
    },
    validatecalculate() {
      if (!this.selectedStatus) {
        this.msg = "Please Select Status";
        this.showSnackBar = true;
        return;
      } else if (this.selectedStatus === "APPROVED" && !this.refundamount) {
        this.msg = "Please Enter Refund Amount";
        this.showSnackBar = true;
        return;
      } else {
        this.updatecalculation();
      }
    },
    updatecalculation() {
      this.appLoading = true;
      axios({
        method: "POST",
        url: "/v1/admin/application/commission-summary",
        headers: {
          "authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        data: {
          // status: this.selectedStatus,
          id: this.$route.query.id,
          refundAmount: this.refundamount,
        },
      })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            this.calculationData = response.data.data;
            this.msg = response.data.message;
            this.showSnackBar = true;
            this.getData();
          } else {
            this.msg = response.data.message;
            this.showSnackBar = true;
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
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    updateStatus() {
      this.appLoading = true;
      axios({
        method: "POST",
        url: "/v1/admin/application/update-status",
        headers: {
          "authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        data: {
          status: this.selectedStatus,
          id: this.$route.query.id,
          refundAmount: this.refundamount,
          discountAmount: this.discount,
        },
      })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            this.msg = response.data.message;
            this.showSnackBar = true;
            this.getData();
          } else {
            this.msg = response.data.message;
            this.showSnackBar = true;
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
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    downloadPdf(pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.setAttribute("download", "file.pdf"); // Replace 'file.pdf' with your desired file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    formatQuestionDate(item) {
      const date = new Date(item);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
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
  },
};
</script>

<style scoped>
.dialog-card {
  font-family: interbold;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.dialog-icon {
  animation: pulse 1s infinite alternate;
}

.dialog-button {
  min-width: 120px;
}

@keyframes pulse {
  from {
    transform: scale(1);
    opacity: 0.7;
  }

  to {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>
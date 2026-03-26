<template>
  <div style="background-color: #ebf2ff">
    <v-layout wrap justify-center pt-10 pb-10>
      <v-flex xs12 pa-6>
        <v-layout wrap justify-center>
          <v-flex xs12 lg11 md11 sm10>
            <v-layout wrap justify-center>
              <v-flex xs12 text-left>
                <span
                  style="
                    font-family: FajallaOne;
                    font-weight: 400;
                    font-size: 30px;
                    line-height: 37.71px;
                  "
                >
                  Get Your Tax Refund in Just 3 Easy
                  <span style="color: #1a73e9"
                    >Steps <span style="color: #000000">!</span></span
                  >
                </span>
              </v-flex>
              <v-flex xs12 text-left pt-2>
                <span
                  style="
                    font-family: DMSans;
                    font-weight: 400;
                    font-size: 18px;
                    line-height: 23.44px;
                  "
                >
                  Effortless refunds in three steps — we handle the details, you
                  enjoy the results
                </span>
              </v-flex>
              <v-flex xs12 pt-4 class="hidden-md-and-down">
                <v-layout wrap justify-center>
                  <!-- Dynamically Render Cards -->
                  <v-flex
                    xs12
                    lg4
                    pl-4
                    v-for="(step, index) in steps"
                    :key="index"
                  >
                    <v-card height="300" width="500" class="arrow-card">
                      <v-layout wrap justify-center fill-height>
                        <v-flex xs12 align-self-center>
                          <v-layout wrap justify-center>
                            <v-flex xs12 text-left lg8>
                              <span class="taxstepcardhead">{{
                                step.title
                              }}</span>
                            </v-flex>
                            <v-flex xs12 text-left lg8>
                              <span class="taxstepcardbody">{{
                                step.description
                              }}</span>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-card>
                  </v-flex>
                </v-layout>
              </v-flex>
              <v-flex xs12 pt-4 class="hidden-lg-and-up">
                <v-layout wrap justify-center>
                  <!-- Dynamically Render Cards -->
                  <v-flex
                    xs12
                    lg4
                    sm4
                    md4
                    pl-0
                    pl-lg-4 pl-sm-4 pl-md-4
                    pt-lg-0 pt-sm-0 pt-md-0
                    pt-4
                    v-for="(step, index) in steps"
                    :key="index"
                  >
                    <v-card height="250" pt-4>
                      <v-layout wrap justify-center fill-height>
                        <v-flex xs10 sm10 align-self-center>
                          <v-layout wrap justify-center>
                            <v-flex xs12 text-left lg8>
                              <span class="taxstepcardhead">{{
                                step.title
                              }}</span>
                            </v-flex>
                            <v-flex xs12 text-left lg8>
                              <span class="taxstepcardbody">{{
                                step.description
                              }}</span>
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
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
export default {
  data() {
    return {
      steps: [
        {
          title: "1. Fill Out the Form",
          description:
            "Enter your details in a few minutes. Simple and straightforward.",
        },
        {
          title: "2. We Review and Process",
          description:
            "Our experts analyze your records to identify all eligible refunds",
        },
        {
          title: "3. Get Your Refund",
          description:
            "Receive your refund directly into your bank account — fast and secure",
        },
      ],
    };
  },
};
</script>
<style>
.taxstepcardhead {
  font-family: DMSans;
  font-weight: 700;
  font-size: 20px;
  color: #1a73e9;
}
.taxstepcardbody {
  font-family: DMSans;
  font-weight: 400;
  font-size: 16px;
  color: #000000a6;
}
.arrow-card {
  position: relative;
  background-color: #1a73e9; /* Card background color */
  color: #ffffff; /* Text color */
  width: 300px; /* Width of the card */
  height: 150px; /* Height of the card */
  clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%); /* Arrow shape pointing right on both sides */
  transition: transform 0.3s ease, box-shadow 0.3s ease; /* Smooth hover effects */
  overflow: hidden;
  border-bottom: 4px solid #1A73E9 !important;
  border-top: 4px solid #1A73E9 !important;
}
.arrow-card:hover {
  transform: scale(1.05); /* Slightly enlarge the card on hover */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* Add shadow on hover */
}
</style>
  
<template>
    <div>
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
                  Experience the Taxmind 
                    <span style="color: #1a73e9"
                      >Advantage</span
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
                  Simplifying Tax Refunds with Trust, Efficiency, and Results You Can Count On.
                  </span>
                </v-flex>
                <v-flex xs12 pt-4>
                  <v-layout wrap justify-center>
                    <!-- Dynamically Render Cards -->
                    <v-flex
                      xs12
                      lg3
                      sm6
                      md6
                      v-for="(step, index) in steps"
                      :key="index"
                    >
                      <v-card height="370" pt-4 class="my-2">
                        <v-layout wrap justify-center fill-height pa-5>
                          <v-flex xs12 align-self-center>
                            <v-layout wrap justify-center>
                              <v-flex xs12 pa-3>
                                <v-img :src="step.img" height="80px" width="80px" class="mx-auto"></v-img>
                              </v-flex>
                              <v-flex xs12 text-center pa-3>
                                <span class="advhed">{{
                                  step.title
                                }}</span>
                              </v-flex>
                              <v-flex xs12 text-center pa-3>
                                <span class="advbdy">{{
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
            title: "Maximized Refunds",
            description:
              "Our experts thoroughly analyze your tax records to ensure you claim every cent you deserve — no refund left behind.",
              img:  require("./../../assets/images/adv1.webp"),
          },
          {
            title: "Secure and Compliant",
            description:
              "We work in full compliance with Irish Revenue standards, guaranteeing safety and accuracy at every step.",
              img:  require("./../../assets/images/adv2.webp"),
          },
          {
            title: "Stress-Free Process",
            description:
              "Say goodbye to tax headaches. We handle everything — from paperwork to filing — so you don’t have to.",
              img:  require("./../../assets/images/adv3.webp"),
          },
          {
            title: "Expert Revenue Support",
            description:
              "TaxMind handles Revenue queries, ensuring accurate, hassle-free tax filing for you with complete peace of mind",
              img:  require("./../../assets/images/adv4.webp"),
          },
        ],
      };
    },
  };
  </script>
  <style>
  .advhed {
    font-family: DMSans;
    font-weight: 700;
    font-size: 18px;
    color: #000000;
  }
  .advbdy {
    font-family: DMSans;
    font-weight: 400;
    font-size: 16px;
    color: #8B827D;
    text-align: justify !important;
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
    
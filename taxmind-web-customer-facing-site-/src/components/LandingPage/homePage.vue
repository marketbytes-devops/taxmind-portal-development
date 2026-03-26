<template>
  <div>
    <PageLoader v-bind:storage="appLoading" />
    <ServerError v-if="ServerError" />
    <!-- Global snackbar mounted in App.vue; use this.$snackbar.showSuccess()/showError() -->
    <v-layout wrap justify-center pt-0 pt-lg-16>
      <v-flex xs12 pt-16>
        <CarouselItem />
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center>
      <v-flex xs12>
        <TaxCredits />
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center>
      <v-flex xs12>
        <TaxSteps />
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center>
      <v-flex xs12>
        <Advantages />
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center>
      <v-flex xs12>
        <ShortDescription />
      </v-flex>
    </v-layout>
    <v-layout wrap justify-center>
      <v-flex xs12>
        <FAQSection />
      </v-flex>
    </v-layout>

    <v-layout wrap justify-center>
      <v-flex xs12>
        <MailUs />
      </v-flex>
    </v-layout>
  </div>
</template>
    <script>
import { ApiMigrationMixin } from "../../utils/apiMigration";
import CarouselItem from "./carousal.vue";
import TaxCredits from "./taxCredits.vue";
import TaxSteps from "./taxSteps.vue";
import Advantages from "./advantages.vue";
import ShortDescription from "./shortDetails.vue";
import FAQSection from "./faqSection.vue";
import MailUs from "./mailUs.vue";

export default {
  mixins: [ApiMigrationMixin],
  metaInfo: {
    title: "TaxMind - Simplify Your Tax Filing Process",
    meta: [
      {
        name: "description",
        content:
          "TaxMind offers an easy and secure way to file your taxes online. Explore tax credits, step-by-step filing guidance, and maximize your refunds effortlessly.",
      },
      {
        name: "keywords",
        content:
          "tax filing, online tax filing, tax credits, maximize tax refund, income tax, tax benefits, e-filing, tax preparation, tax deductions, tax return",
      },
      {
        property: "og:title",
        content: "TaxMind - Hassle-Free Online Tax Filing",
      },
      {
        property: "og:description",
        content:
          "File your taxes online with ease using TaxMind. Learn about tax credits, step-by-step filing, and advantages of using our tax solution.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/", // Replace with your actual website URL
      },
      {
        property: "og:type",
        content: "website",
      },
      { name: "robots", content: "index, follow" },
    ],
  },
  components: {
    CarouselItem,
    TaxCredits,
    TaxSteps,
    Advantages,
    ShortDescription,
    FAQSection,
    MailUs,
  },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      category: [],
      programs: [],
      home: {},
      ourStory: {},
      officials: [],
      goals: {},
      programlen: null,
      halfsize: null,
      model: 0,
      caraouselitems: [
        {
          image: "Home.jpg",
          quote:
            "Where humans and <br/> the wild things, <br />peacefully co-exist",
        },
        {
          image: "Home2.jpg",
          quote:
            "Among the top ten <br/> best managed <br/> Tiger Reserves <br/> in the country ",
        },
      ],
    };
  },
  beforeMount() {
    // this.getData();
  },
  methods: {
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/site-contents/config");
        this.appLoading = false;
        this.home = response.data.websiteDetails || response.data;
        this.officials = response.data.officials || [];
        this.ourStory =
          response.data.websiteDetails?.ourStory ||
          response.data.ourStory ||
          {};
        this.goals =
          response.data.websiteDetails?.goals || response.data.goals || {};
      } catch (err) {
        this.appLoading = false;
        this.ServerError = true;
      }
    },
  },
};
</script>

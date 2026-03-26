<template>
  <div>
    <v-layout wrap justify-center style="background-color: #021e44">
      <v-flex xs12>
        <v-layout wrap>
          <v-flex xs12 sm8 pa-5>
            <span class="mailushead"
              >Have Questions or Need Assistance? We're Here to Help You Every
              Step of the Way!</span
            >
          </v-flex>
          <v-flex xs12 sm4 style="background-color: #043a82">
            <v-layout wrap justify-start pa-5>
              <v-flex xs5 sm4 md3>
                <v-avatar size="60" color="#FFFFFF">
                  <v-icon dark medium color="#1A73E9">mdi-email</v-icon>
                </v-avatar>
              </v-flex>
              <v-flex xs7 sm8 md9 text-left>
                <span class="mailussub">Mail us !</span><br />
                <span
                  style="
                    font-family: DMSans;
                    font-weight: 400;
                    font-size: 16px;
                    color: #ffffff;
                  "
                  ><a
                    :href="'mailto:' + headerData.email"
                    style="
                      font-family: DMSans;
                      font-weight: 400;
                      font-size: 16px;
                      color: #ffffff;
                      text-decoration: none;
                    "
                    >{{ headerData.email }}</a
                  ></span
                >
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
import { ApiMigrationMixin } from "../../utils/apiMigration";

export default {
  mixins: [ApiMigrationMixin],
  components: {},
  data() {
    return {
      headerData: {},
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    async getData() {
      try {
        this.appLoading = true;
        const response = await this.fetchData("/site-contents/config");
        this.appLoading = false;

        // Handle TAXMIND.json response structure
        if (response.success && response.data) {
          this.headerData = {
            email:
              response.data.headerEmail ||
              response.data.webpage?.header?.email ||
              "info@taxmind.ie",
          };
        } else {
          // Fallback value
          this.headerData = {
            email: "info@taxmind.ie",
          };
        }
      } catch (err) {
        this.appLoading = false;
        // Error handling automatically done by ApiMigrationMixin
        // Set fallback value on error
        this.headerData = {
          email: "info@taxmind.ie",
        };
      }
    },
  },
};
</script>
<style scoped>
.mailushead {
  font-family: FajallaOne;
  font-weight: 400;
  font-size: 28px;
  color: #ffffff;
}
.mailussub {
  font-family: FajallaOne;
  font-weight: 400;
  font-size: 20px;
  color: #ffffff;
}
</style>

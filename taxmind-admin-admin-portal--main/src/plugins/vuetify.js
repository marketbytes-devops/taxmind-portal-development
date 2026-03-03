import Vue from "vue";
import Vuetify from "vuetify/lib";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

export default new Vuetify({
  theme: { 
    themes: {
     light: {
        primary: "#1A73E9",      
        error: "#D53E3E",        
        backgroundOne: "#F1F7FF", 
        backgroundTwo: "#FFFFFF", 
        background2: "#29A61A",   
        background3: "#5F5F5F1A",
        docBackground: "#D53E3E0D",
        greyText: "#5F5F5F",
        cardBorder: "rgba(0, 0, 0, 0.1)",
        inputBorder: "rgba(95, 95, 95, 0.16)",
      },

    },
  },
  defaultAssets: {
   font: false,
  },
});

<template>
  <div>
    <v-app-bar
    color="white"
    elevation="0"
    dark
    class="hidden-sm-and-down"
    height="40px"
  >
    <!-- <v-app-bar color="#003D29" elevation="3" dark height="40px"> -->
      <v-layout wrap justify-center fill-height>
       <v-flex  class="moving-text-wrapper" xs12 sm12 md12 lg12 align-self-center >
          <span class="moving-text">Website is under development</span>
        </v-flex> 

      </v-layout>
      </v-app-bar>

      <v-app-bar
    color="white"
    elevation="0"
    dark
    class="hidden-md-and-up"
    height="40px"
  >
    <!-- <v-app-bar color="#003D29" elevation="3" dark height="40px"> -->
      <v-layout wrap justify-center fill-height>
       <v-flex  class="moving-text-wrapper" xs12 sm12 md12 lg12 align-self-center >
          <span class="moving-text">Website is under development</span>
        </v-flex> 

      </v-layout>
      </v-app-bar>
    <!-- </v-app-bar> -->
  </div>
</template>
    <script>
//   import Notification from "./notification";
//import AccountMenuEco from "./accountMenuEco";
export default {
  components: {
    //   Notification,
    // AccountMenuEco,
  },
  data() {
    return {
      
    };
  },
};
</script>
    <style >
   
.moving-text-wrapper {
  overflow: hidden;

}

.moving-text {
  display: inline-block;
  color: #f90606;
  font-family: YesevaOne;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 16px;

  animation: moveText 10s linear infinite;
}

@keyframes moveText {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

</style>
<template>
  <v-app>
    <v-main class="ServerError">
      <v-container fluid fill-height>
        <v-row
          justify="center"
          style="
            font-family: poppinssemibold;
            color: #464646;
            letter-spacing: 2px;
          "
        >
          <v-col text-center>
            <v-img
              src="../../assets/images/serverError.svg"
              height="150px"
              contain
            >
            </v-img>
          </v-col>
          <v-col pt-12 cols="12" text-center>
            <span style="font-size: 30px"> 500! </span>
          </v-col>
          <v-col cols="12" text-center>
            <span style="font-size: 18px; font-family: opensansregular">
              Oops something went wrong in our side
            </span>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
  <style scoped>
.ServerError {
  min-height: 100vh;
  min-width: 100vw;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 99999;
  background-color: white;
  overflow-x: hidden;
}
</style>
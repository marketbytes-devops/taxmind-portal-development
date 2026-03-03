<template>
    <div>
      <v-layout
        wrap
        justify-center
        fluid
        fill-height
        pt-12
        style="font-family: poppinsregular; color: #464646"
      >
        <v-flex xs12 pt-12>
          <v-img src="./../../assets/pageNotFound.svg" alt="Page Not Found" height="150px" contain />
        </v-flex>
        <v-flex pt-12 xs12 text-center>
          <span style="font-size: 25px"> 404! </span>
        </v-flex>
        <v-flex xs12 text-center>
          <span style="font-size: 18px">
            We didn't find that Page you are looking for
          </span>
        </v-flex>
      </v-layout>
    </div>
  </template>
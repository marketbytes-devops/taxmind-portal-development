<template>
    <div>
      <vue-element-loading
        :active="storage"
        :is-full-screen="!!!contain"
        background-color="#FFFFFF"
        color="#1A73E9"
        spinner="bar-fade-scale"
      >
        <!-- <v-img src="./../../assets/logo.png" alt="logo" height="200px" contain /> -->
      </vue-element-loading>
    </div>
  </template>
  <script>
  export default {
    props: ["storage", "contain"],
  };
  </script>
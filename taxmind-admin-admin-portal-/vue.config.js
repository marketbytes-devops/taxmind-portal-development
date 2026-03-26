module.exports = {
  transpileDependencies: [
    "vuetify",
    /firebase/,
    /@firebase/
  ],
  configureWebpack: {
    devtool: "source-map",
  },
  productionSourceMap: false,
};

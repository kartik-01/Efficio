const path = require("path");
const createWebpackConfig = require("../../configs/createWebpackConfig");

module.exports = createWebpackConfig({
  appName: "analytics",
  port: process.env.PORT || 3003,
  moduleFederation: {
    name: "analytics",
    exposes: {
      "./Module": path.resolve(__dirname, "src/Module")
    }
  }
});


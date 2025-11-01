const path = require("path");
const createWebpackConfig = require("../../configs/createWebpackConfig");

module.exports = createWebpackConfig({
  appName: "time-tracker",
  port: process.env.PORT || 3002,
  moduleFederation: {
    name: "time_tracker",
    exposes: {
      "./Module": path.resolve(__dirname, "src/Module")
    }
  }
});


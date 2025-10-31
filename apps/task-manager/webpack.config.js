const path = require("path");
const createWebpackConfig = require("../../configs/createWebpackConfig");

module.exports = createWebpackConfig({
  appName: "task-manager",
  port: process.env.PORT || 3001,
  moduleFederation: {
    name: "task_manager",
    exposes: {
      "./Module": path.resolve(__dirname, "src/Module")
    }
  }
});


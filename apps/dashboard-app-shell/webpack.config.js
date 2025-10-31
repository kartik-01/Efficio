const path = require("path");
const createWebpackConfig = require("../../configs/createWebpackConfig");

module.exports = createWebpackConfig({
  appName: "dashboard-app-shell",
  port: process.env.PORT || 3000,
  moduleFederation: {
    name: "app_shell",
    remotes: {
      task_manager: "task_manager@http://localhost:3001/remoteEntry.js",
      time_tracker: "time_tracker@http://localhost:3002/remoteEntry.js",
      analytics: "analytics@http://localhost:3003/remoteEntry.js"
    }
  }
});


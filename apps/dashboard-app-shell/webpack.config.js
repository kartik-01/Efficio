const path = require("path");
const createWebpackConfig = require("../../configs/createWebpackConfig");

const isProduction = process.env.NODE_ENV === "production";

module.exports = createWebpackConfig({
  appName: "dashboard-app-shell",
  port: process.env.PORT || 3000,
  moduleFederation: {
    name: "app_shell",
    remotes: isProduction
      ? {
          task_manager: "task_manager@https://test-effici0-task.netlify.app/remoteEntry.js",
          time_tracker: "time_tracker@https://test-effici0-time.netlify.app/remoteEntry.js",
          analytics: "analytics@https://test-effici0-analytics.netlify.app/remoteEntry.js"
        }
      : {
          task_manager: "task_manager@http://localhost:3001/remoteEntry.js",
          time_tracker: "time_tracker@http://localhost:3002/remoteEntry.js",
          analytics: "analytics@http://localhost:3003/remoteEntry.js"
        }
  }
});


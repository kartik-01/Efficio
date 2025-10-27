const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { ModuleFederationPlugin, FederationRuntimePlugin } =
  require("@module-federation/enhanced");

const isProd = process.env.NODE_ENV === "production";

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: path.resolve(__dirname, "src/index.ts"),

  mode: isProd ? "production" : "development",
  devtool: isProd ? "source-map" : "eval-cheap-module-source-map",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isProd ? "[name].[contenthash].js" : "[name].js",
    publicPath: "auto",
    clean: true,
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".css"],
    alias: {
      "@shared-design-token": path.resolve(__dirname, "../../shared-design-token"),
    },
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: "defaults" }],
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          isProd ? MiniCssExtractPlugin.loader : "style-loader",
          "css-loader",
          "postcss-loader",
        ],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
    }),
    new MiniCssExtractPlugin({
      filename: isProd ? "styles.[contenthash].css" : "[name].css",
      chunkFilename: isProd ? "styles.[contenthash].css" : "[id].css",
    }),

    new ModuleFederationPlugin({
      name: "app_shell",
      filename: "remoteEntry.js",

      // Dynamic remotes for dev & prod
      remotes: {
        task_manager: isProd
          ? "task_manager@https://dev-effici0-tasks.netlify.app/remoteEntry.js"
          : "task_manager@http://localhost:3001/remoteEntry.js",
        time_tracker: isProd
          ? "time_tracker@https://effici0-time.netlify.app/remoteEntry.js"
          : "time_tracker@http://localhost:3002/remoteEntry.js",
        analytics: isProd
          ? "analytics@https://effici0-analytics.netlify.app/remoteEntry.js"
          : "analytics@http://localhost:3003/remoteEntry.js",
      },

      shared: {
        react: { singleton: true, requiredVersion: "^19.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.0" },
        "@auth0/auth0-react": { singleton: true },
      },
    }),

    !isProd &&
      new FederationRuntimePlugin({
        reloadOnRemoteChange: true,
      }),
  ].filter(Boolean),

  devServer: {
    port: 3000,
    hot: true,
    liveReload: true,
    historyApiFallback: true,
    headers: { "Access-Control-Allow-Origin": "*" },
    client: { overlay: false },
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get("/__trigger_reload__", (_req, res) => {
        console.log("[MFE] Remote rebuild detected → reloading host");
        res.sendStatus(200);
        setTimeout(() => {
          devServer.sendMessage(devServer.webSocketServer.clients, "static-changed");
        }, 500);
      });
      return middlewares;
    },
  },

  performance: {
    hints: false,
  },

  ignoreWarnings: [
    { message: /Script error/ },
    { message: /ChunkLoadError/ },
  ],
};

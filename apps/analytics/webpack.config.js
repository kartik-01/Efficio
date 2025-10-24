const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { container } = require("webpack");
const { ModuleFederationPlugin } = container;

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
  resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"] },
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
      filename: isProd ? "[name].[contenthash].css" : "[name].css",
    }),
    new ModuleFederationPlugin({
      name: "analytics",
      filename: "remoteEntry.js",
      exposes: {
        "./Widget": path.resolve(__dirname, "src/Widget"),
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: require("react/package.json").version,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: require("react-dom/package.json").version,
        },
      },
    }),
  ],
devServer: {
  port: 3003,
  hot: true,
  liveReload: true,
  historyApiFallback: true,
  headers: { "Access-Control-Allow-Origin": "*" },
  client: { overlay: false },
  setupMiddlewares: (middlewares, devServer) => {
    if (!devServer) throw new Error("webpack-dev-server is not defined");
    devServer.compiler.hooks.done.tap("NotifyHostReload", () => {
      fetch("http://localhost:3000/__trigger_reload__").catch(() => {});
    });
    return middlewares;
  },
},


};

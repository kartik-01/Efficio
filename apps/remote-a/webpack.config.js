// apps/remote-a/webpack.config.cjs
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { container } = require("webpack");
const { ModuleFederationPlugin } = container;

const isProd = process.env.NODE_ENV === "production";

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: path.resolve(__dirname, "src/index.ts"), // ✅ absolute path

  mode: isProd ? "production" : "development",
  devtool: isProd ? "source-map" : "eval-cheap-module-source-map",

  output: {
    path: path.resolve(__dirname, "dist"), // ✅ absolute path
    filename: isProd ? "[name].[contenthash].js" : "[name].js",
    publicPath: "auto",
    clean: true,
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
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
      template: path.resolve(__dirname, "public/index.html"), // ✅ absolute path
    }),
    new MiniCssExtractPlugin({
      filename: isProd ? "[name].[contenthash].css" : "[name].css",
    }),
    new ModuleFederationPlugin({
      name: "remote_a",
      filename: "remoteEntry.js",
      exposes: {
        "./Widget": path.resolve(__dirname, "src/Widget"), // ✅ absolute path
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
    port: 3001,
    historyApiFallback: true,
    hot: true,
    headers: { "Access-Control-Allow-Origin": "*" },
  },
};

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

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    alias: {
      // no MUI / emotion aliases
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
      filename: isProd ? "[name].[contenthash].css" : "[name].css",
    }),

    new ModuleFederationPlugin({
      name: "app_shell",
      filename: "remoteEntry.js",
      remotes: {
        // keep remotes if you will use them later; they can remain unreachable
        remote_a: "remote_a@http://localhost:3001/remoteEntry.js",
        remote_b: "remote_b@http://localhost:3002/remoteEntry.js",
        remote_c: "remote_c@http://localhost:3003/remoteEntry.js",
      },
      // remove MUI/emotion sharing entries
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.0" },
        "@auth0/auth0-react": { singleton: true },
      },
    }),
  ],

  devServer: {
    port: Number(process.env.PORT) || 3000,
    historyApiFallback: true,
    hot: true,
    headers: { "Access-Control-Allow-Origin": "*" },
  },
};
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { container } = require("webpack");

const { createSharedConfig, resolveWorkspaceAliases } = require("../webpack.shared");

/**
 * Creates a webpack configuration for a micro-frontend application
 * @param {Object} options - Configuration options
 * @param {string} options.appName - Name of the application (e.g., 'dashboard-app-shell')
 * @param {number} options.port - Dev server port
 * @param {Object} options.moduleFederation - Module Federation configuration
 * @param {string} options.moduleFederation.name - Module Federation name
 * @param {Object} [options.moduleFederation.remotes] - Remote modules (for host apps)
 * @param {Object} [options.moduleFederation.exposes] - Exposed modules (for remote apps)
 * @returns {Object} Webpack configuration
 */
function createWebpackConfig(options) {
  const { appName, port, moduleFederation } = options;
  const isProduction = process.env.NODE_ENV === "production";

  return {
    entry: path.resolve(__dirname, `../apps/${appName}/src/index.tsx`),
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? "source-map" : "eval-source-map",
    output: {
      filename: isProduction ? "[name].[contenthash:8].js" : "[name].js",
      chunkFilename: isProduction ? "[name].[contenthash:8].js" : "[name].js",
      path: path.resolve(__dirname, `../apps/${appName}/dist`),
      publicPath: "auto",
      clean: true
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
      alias: {
        ...resolveWorkspaceAliases
      }
    },
    devServer: {
      static: path.resolve(__dirname, `../apps/${appName}/public`),
      historyApiFallback: true,
      hot: true,
      port: Number(port)
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          loader: "babel-loader"
        },
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                modules: false
              }
            },
            "postcss-loader"
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource"
        }
      ]
    },
    plugins: [
      new container.ModuleFederationPlugin({
        name: moduleFederation.name,
        filename: "remoteEntry.js",
        ...(moduleFederation.remotes && { remotes: moduleFederation.remotes }),
        ...(moduleFederation.exposes && { exposes: moduleFederation.exposes }),
        shared: createSharedConfig()
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, `../apps/${appName}/public/index.html`)
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? "[name].[contenthash:8].css" : "[name].css"
      })
    ]
  };
}

module.exports = createWebpackConfig;


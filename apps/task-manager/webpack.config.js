const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { container } = require("webpack");
const { ModuleFederationPlugin } = container;

const isProd = process.env.NODE_ENV === "production";

// Plugin to inject CSS links - uses relative paths that work with publicPath: "auto"
class CssInjectPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('CssInjectPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('CssInjectPlugin', (data, cb) => {
        const cssFiles = Object.keys(compilation.assets).filter(file => file.endsWith('.css'));
        if (cssFiles.length > 0) {
          // Use just the filename - webpack's publicPath: "auto" will handle the base URL
          const cssLinks = cssFiles
            .map(file => `<link rel="stylesheet" href="${file}">`)
            .join('\n');
          data.html = data.html.replace('</head>', `  ${cssLinks}\n</head>`);
        }
        cb(null, data);
      });
    });
  }
}

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
       use: ["style-loader", "css-loader", {
         loader: "postcss-loader",
         options: { postcssOptions: { config: path.resolve(__dirname, "../..") } }
       }],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
      inject: true,
      scriptLoading: 'defer',
      minify: isProd ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false,
    }),
    new MiniCssExtractPlugin({
      filename: isProd ? "css/[name].[contenthash].css" : "css/[name].css",
      chunkFilename: isProd ? "css/[id].[contenthash].css" : "css/[id].css",
    }),
    new CssInjectPlugin(),
    new ModuleFederationPlugin({
      name: "task_manager",
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
        // Share CSS related modules to ensure consistent style loading
        "style-loader": { singleton: true },
        "css-loader": { singleton: true },
        "mini-css-extract-plugin/dist/loader": { singleton: true },
      },
    }),
  ],

devServer: {
  port: 3001,
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

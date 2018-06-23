const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './development/src/index.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'production', 'src'),
    filename: 'main.[hash].js',
  },
  module: {
    rules: [
      {
        // .js loader
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }, {
        // .css loader
        test: /\.css$/,
        use: [
          MiniCSSExtractPlugin.loader,
          'css-loader',
        ],
      }, {
        // font-loader
        test: /\.ttf$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: '../fonts/',
            publicPath: '../fonts/',
          },
        }],
      },
    ],
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: './development/public/index.html',
      filename: '../index.html',
      inject: 'body',
    }),
    new MiniCSSExtractPlugin(),
    new UglifyJSWebpackPlugin(),
  ],
};

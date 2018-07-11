const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCssAssetsExtractPlugin = require('optimize-css-assets-webpack-plugin');

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
        test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
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
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new MiniCSSExtractPlugin(),
    new webpack.optimization.ModuleConcatenationPlugin(),
  ],
  optimization: {
    minimizer: [
      new UglifyJSWebpackPlugin({
        cache: true,
        parallel: true,
      }),
      new OptimizeCssAssetsExtractPlugin(),
    ],
  },
};

const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.js',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'mcp.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      // Add loaders here if you use other file types (e.g., Babel for ES6)
    ],
  },
  externals: [
    nodeExternals(),
  ],
  resolve: {
    extensions: ['.js'],
  },
  mode: 'production',
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
  ],
}; 
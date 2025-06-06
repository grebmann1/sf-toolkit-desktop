require('dotenv').config();
const path = require('path');
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    resolve: {
        
    },
    entry: './src/main.js',
    // Put your normal webpack config below here
    module: {
        rules: require('./webpack.rules'),
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: process.env.NODE_ENV,
            API_HOST: process.env.API_HOST,
            API_PORT: process.env.API_PORT,
            DEV_URL: process.env.DEV_URL,
            PROD_URL: process.env.PROD_URL,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/workers/*.worker.js'),
                    to: 'workers/[name][ext]',
                    noErrorOnMissing: true,
                },
            ],
        }),
    ],
};

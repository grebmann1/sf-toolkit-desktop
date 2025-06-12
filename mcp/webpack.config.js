import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
export default {
    entry: './src/index.js',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'mcp.js',
        library: {
            type: 'module',
        },
        module: true,
    },
    experiments: {
        outputModule: true,
    },
    module: {
        rules: [
            // Add loaders here if you use other file types (e.g., Babel for ES6)
        ],
    },
    externals: [],
    resolve: {
        extensions: ['.ts', '.json', '.mjs', '.js'],
        mainFields: ['module', 'main'],
    },
    mode: isDev ? 'development' : 'production',
    plugins: [new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })],
};

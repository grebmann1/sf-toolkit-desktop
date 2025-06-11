import webpack from 'webpack';
import config from './webpack.config.js';

const isWatch = process.argv.includes('--watch');

function printStats(stats) {
    const info = stats.toJson({ all: false, warnings: true, errors: true, assets: true });
    if (stats.hasErrors()) {
        console.error('❌ Build failed with errors:');
        info.errors.forEach(e => console.error(e));
    }
    if (stats.hasWarnings()) {
        console.warn('⚠️ Build completed with warnings:');
        info.warnings.forEach(w => console.warn(w));
    }
    if (info.assets && info.assets.length > 0) {
        console.log('📦 Output files:');
        info.assets.forEach(asset => {
            console.log(`  - ${asset.name} (${asset.size} bytes)`);
        });
    }
    console.log(stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
    }));
}

console.log(`[${new Date().toLocaleTimeString()}] Starting Webpack build${isWatch ? ' in watch mode' : ''}...`);

const compiler = webpack(config);

function runCallback(err, stats) {
    if (err) {
        console.error('❌ Fatal error during build:', err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        process.exit(1);
    }
    printStats(stats);
    if (stats.hasErrors()) {
        process.exit(1);
    } else {
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Build finished successfully.`);
        if (!isWatch) process.exit(0);
    }
}

if (isWatch) {
    compiler.watch({}, runCallback);
} else {
    compiler.run(runCallback);
} 
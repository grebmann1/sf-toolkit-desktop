require('dotenv').config();
const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
module.exports = {
    packagerConfig: {
        asar: true,
        prune: true,
        icon: 'public/sfdx_gui.icns',
        osxSign: {}, // object must exist even if empty
        osxNotarize: {
            tool: 'notarytool',
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
        },
        extraResource: ['public', path.resolve(__dirname, '.env'), path.resolve(__dirname, 'mcp/dist/mcp.js')],
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
        {
            name: '@electron-forge/plugin-webpack',
            config: {
                mainConfig: './webpack.main.config.js',
                renderer: {
                    config: './webpack.renderer.config.js',

                    entryPoints: [
                        {
                            name: 'lib',
                            preload: {
                                js: './src/preload.js',
                            },
                        },
                    ],
                },
                loggerPort: '9001',
                port: '3050',
            },
        },
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'grebmann1',
                    name: 'sfdx-ui-light', // for now we do a direct deploy to the old repo to migrate everyone to the new repo !!!
                },
                authToken: process.env.GITHUB_TOKEN,
                prerelease: false,
            },
        },
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'grebmann1',
                    name: 'sf-toolkit-desktop', // for now we do a direct deploy to the old repo to migrate everyone to the new repo !!!
                },
                authToken: process.env.GITHUB_TOKEN,
                prerelease: false,
            },
        },
    ],
};

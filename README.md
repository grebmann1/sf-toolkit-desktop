# SF Toolkit Electron

## Installation

Install dependencies:

1. Run `npm install`

## Running the App

### Development Mode

Start Electron in development mode:

1. Run `npm run start:dev:electron`

> **Note:** If you have a separate client, add its start instructions here.

### Production Build

Package the app for production:

1. Run `npm run build:prod:package`

Or, to build and make a distributable package (macOS example):

1. Run `npm run build:prod:package:make`

## Publishing a Release

1. Run a dry run to verify the publish process:
    - `npm run publish:dry`
2. If the dry run succeeds, publish the release:
    - `npm run publish:run`

## Formatting

- Format code: `npm run format`
- Check formatting: `npm run format:check`

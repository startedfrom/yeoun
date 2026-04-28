const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Expo otherwise sets Metro "server root" to the pnpm workspace root, which makes the
// bundle entry look like ./apps/mobile/node_modules/expo-router/entry and breaks resolution
// for some pnpm symlink layouts. Pin server root to this app when using pnpm workspaces.
if (fs.existsSync(path.join(monorepoRoot, 'pnpm-lock.yaml'))) {
  process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';
}

const config = getDefaultConfig(projectRoot);

const existingWatch = config.watchFolders ?? [];
config.watchFolders = [...new Set([...existingWatch, monorepoRoot])];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;

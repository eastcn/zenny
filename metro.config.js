const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add wasm support for expo-sqlite web
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

// Add COOP/COEP headers for SharedArrayBuffer (required by expo-sqlite web)
config.server = config.server || {};
const existingMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = existingMiddleware ? existingMiddleware(middleware, server) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    enhanced(req, res, next);
  };
};

module.exports = config;

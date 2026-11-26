const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/** @type {import("next").NextConfig} */
module.exports = (phase) => ({
  reactStrictMode: true,
  output: "standalone",
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/evm": false,
      "@x402/evm/upto/client": false,
      "@x402/evm/exact/client": false,
      "@x402/core/client": false,
      "@x402/svm/exact/client": false,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      lokijs: false,
      encoding: false,
    };
    return config;
  },
});

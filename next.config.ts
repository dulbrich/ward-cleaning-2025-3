import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side polyfills for node modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        fs: false,
        path: false,
        os: false,
      };
      
      // Add plugin to inject buffer
      config.plugins.push(
        new (require('webpack')).ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;

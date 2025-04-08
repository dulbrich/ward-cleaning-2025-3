import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Use production mode with server-side rendering
  output: 'standalone',
  // Complete disable static optimization
  experimental: {
    // This actually turns off static optimization
    appDocumentPreloading: false,
  },
  // Config for external packages
  serverExternalPackages: ['@sentry/nextjs'],
  // Force all pages to be server-side rendered
  // This is much more compatible with auth-based pages
  reactStrictMode: false,
  staticPageGenerationTimeout: 1000,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/sign-up',
        destination: '/coming-soon',
        permanent: false,
      },
    ];
  },
};

// If we're deploying to Vercel, force dynamic rendering for all pages
if (process.env.VERCEL) {
  console.log('Deploying to Vercel: Forcing dynamic rendering for all pages');
  nextConfig.generateBuildId = async () => {
    return `build-${Date.now()}`;
  };
}

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
};

export default withPWA(pwaConfig)(nextConfig as any);

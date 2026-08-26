import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok domain for Next.js dev HMR (webpack-hmr)
  allowedDevOrigins: ['reverend-protrude-vacation.ngrok-free.dev'],

  // Browser requests stay on the public frontend origin. Next.js forwards
  // them to the local API, so candidates only need the frontend ngrok URL.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:5000/uploads/:path*',
      },
    ];
  },

  // face-api.js contains Node-only code that imports fs/path/crypto.
  // Tell webpack not to resolve those built-ins in the browser bundle.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;

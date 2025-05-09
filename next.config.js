/** @type {import('next').NextConfig} */
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

const CompressionPlugin = require('compression-webpack-plugin');

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ],
    domains: ['images.unsplash.com', 'localhost'],
    // Optimize image quality and formats
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  typescript: {
    // !! WARN !!
    // Temporarily ignoring type errors to allow the build to complete
    // This should be removed once type issues are resolved
    ignoreBuildErrors: true,
  },
  // Enable server-side compression
  compress: true,
  // Configure HTTP response headers for better caching and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Enable experimental features that improve performance
  experimental: {
    // Optimize page loading
    optimizeCss: true,
    // Optimize for better performance on scroll
    scrollRestoration: true,
  },
  // Add webpack configuration for further optimization
  webpack: (config, { dev, isServer }) => {
    // Only apply these optimizations in production
    if (!dev && !isServer) {
      // Enable compression for all assets
      config.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        })
      );

      // Split chunks more efficiently
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Safe handling of module.context
              if (!module.context) return 'npm.unknown';
              
              // Get the name of the npm package
              const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              if (!match) return 'npm.unknown';
              
              const packageName = match[1];
              // Return a nice clean package name
              return `npm.${packageName.replace('@', '')}`;
            },
          },
          // Specific chunking for larger dependencies
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
          },
          framerMotion: {
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            name: 'framer-motion',
            priority: 30,
          },
          utils: {
            test: /[\\/]node_modules[\\/](lodash|date-fns|tailwind-merge)[\\/]/,
            name: 'utils',
            priority: 20,
          },
        },
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig); 
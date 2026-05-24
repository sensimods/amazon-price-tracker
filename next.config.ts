import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: "standalone",

  // puppeteer-extra plugins use dynamic require() calls that webpack can't bundle.
  // These only run in Node.js API routes, so externalize them.
  serverExternalPackages: [
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin",
    "playwright-extra",
  ],

  // Exclude Playwright browser downloads from the standalone trace
  outputFileTracingExcludes: {
    "**/*": [
      "**/.cache/ms-playwright*/**",
      "**/playwright-core/**",
      "**/node_modules/playwright-core/.local-browsers/**",
    ],
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazon.com" },
      { protocol: "https", hostname: "**.media-amazon.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
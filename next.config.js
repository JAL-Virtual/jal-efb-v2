/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // ✅ use remotePatterns instead of deprecated `domains`
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com", // allow Discord avatars
      },
    ],
  },
};

module.exports = nextConfig;

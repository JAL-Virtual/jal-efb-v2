/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "cdn.discordapp.com", // ✅ allow Discord avatars
    ],
  },
};

module.exports = nextConfig;

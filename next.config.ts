import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Keeps dev fast, but disable this to test PWA
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config (images, etc.) goes here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.razorpay.com', // For payment assets if needed
      },
    ],
  },
};

export default withPWA(nextConfig);

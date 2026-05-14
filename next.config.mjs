import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

<<<<<<< HEAD
/** @type {import('next').NextConfig} */
=======
>>>>>>> dev
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
<<<<<<< HEAD
};

export default pwaConfig(nextConfig);
=======
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.razorpay.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
>>>>>>> dev

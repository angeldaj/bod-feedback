import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Stock food photography for the "Panadería de día" theme. Keyword-based,
    // deterministic via ?lock=. Swap these for real/branded shots by dropping
    // files into /public/img and pointing the <FoodImage> src at them.
    remotePatterns: [
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;

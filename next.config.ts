import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida autocontenida (.next/standalone/server.js) para la imagen Docker de
  // producción: solo copia los archivos que cada página necesita, sin arrastrar
  // node_modules completo. Mismo patrón que `comandas` en bodega-soft-nx.
  output: "standalone",
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

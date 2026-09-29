import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida autocontenida (.next/standalone/server.js) para la imagen Docker de
  // producción: solo copia los archivos que cada página necesita, sin arrastrar
  // node_modules completo. Mismo patrón que `comandas` en bodega-soft-nx.
  output: "standalone",
  // Rutas viejas del feedback: todo vive en /feedback (spec feedback v2).
  // Temporales (307) a propósito: si el QR o la estructura cambian, no quedan
  // cacheadas para siempre en los teléfonos. `/satisfaccion/qr` (el cartel) no
  // coincide con estas reglas y se sigue sirviendo.
  async redirects() {
    return [
      { source: "/satisfaccion", destination: "/feedback?tab=encuesta", permanent: false },
      { source: "/reportar", destination: "/feedback?tab=urgente", permanent: false },
      // Menús por local, alojados en YourQuickMenu. Temporales por la misma
      // razón: si cambia el menú, el QR sigue sirviendo sin caché vieja.
      {
        source: "/menu/2",
        destination: "https://www.yourquickmenu.com/menu/cmrm6e1ud000004ldvljcpd4o",
        permanent: false,
      },
      {
        source: "/menu/3",
        destination: "https://www.yourquickmenu.com/menu/cmu2momrw001n6ghu9m26tetg",
        permanent: false,
      },
    ];
  },
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

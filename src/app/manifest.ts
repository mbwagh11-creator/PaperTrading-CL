import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PRO-TRADER",
    short_name: "PRO-TRADER",
    description: "NSE options paper trading, journal and analytics",
    start_url: "/",
    display: "standalone",
    background_color: "#09111a",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

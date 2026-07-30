import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyProdigi by DTC PRODIGI",
    short_name: "MyProdigi",
    description: "Compete, connect, and grow with MyProdigi",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f0f14",
    theme_color: "#0f0f14",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

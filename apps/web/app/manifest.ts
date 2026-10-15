import type { MetadataRoute } from "next";
import { getTheme } from "@/lib/api";
import { pwaIconPath } from "@/lib/pwa";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const theme = await getTheme();

  return {
    name: theme.shopName,
    short_name: theme.shopName,
    description: theme.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: theme.colors.background,
    theme_color: theme.colors.primary,
    icons: [
      { src: pwaIconPath(192, theme.iconUrl), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: pwaIconPath(512, theme.iconUrl), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: pwaIconPath(192, theme.iconUrl, true), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: pwaIconPath(512, theme.iconUrl, true), sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}

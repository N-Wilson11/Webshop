import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getTheme } from "@/lib/api";
import { PWA_ICON_SIZES } from "@/lib/pwa";

export const dynamic = "force-dynamic";

// Formats the OG image renderer can draw; anything else (e.g. WebP) is served as-is.
const RENDERABLE_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const CACHE_CONTROL = "public, max-age=86400";

export async function GET(request: NextRequest, { params }: { params: { size: string } }) {
  const size = Number(params.size);
  if (!PWA_ICON_SIZES.includes(size as (typeof PWA_ICON_SIZES)[number])) {
    return new Response("Unsupported icon size", { status: 404 });
  }

  const maskable = request.nextUrl.searchParams.get("maskable") === "1";
  const theme = await getTheme();

  let logoSrc: string | null = null;
  try {
    const res = await fetch(new URL(theme.iconUrl, request.nextUrl.origin), { cache: "no-store" });
    if (res.ok) {
      const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
      const bytes = await res.arrayBuffer();
      if (!RENDERABLE_TYPES.includes(contentType)) {
        return new Response(bytes, {
          headers: { "Content-Type": contentType || "application/octet-stream", "Cache-Control": CACHE_CONTROL }
        });
      }
      logoSrc = `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
    }
  } catch {
    // Fall through to the lettermark below.
  }

  // Maskable icons get cropped by the OS, so keep the logo inside the safe zone.
  const logoSize = Math.round(size * (maskable ? 0.7 : 1));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: maskable || !logoSrc ? theme.colors.background : "transparent"
        }}
      >
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt="" width={logoSize} height={logoSize} style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ fontSize: size * 0.5, fontWeight: 700, color: theme.colors.primary }}>
            {theme.shopName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}

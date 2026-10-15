export const PWA_ICON_SIZES = [180, 192, 512] as const;

// Short hash of the icon URL so installed apps pick up a new icon when the theme changes.
export function iconVersion(iconUrl: string) {
  let hash = 0;
  for (let i = 0; i < iconUrl.length; i++) {
    hash = (hash * 31 + iconUrl.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function pwaIconPath(size: number, iconUrl: string, maskable = false) {
  const params = new URLSearchParams({ v: iconVersion(iconUrl) });
  if (maskable) params.set("maskable", "1");
  return `/pwa-icon/${size}?${params}`;
}

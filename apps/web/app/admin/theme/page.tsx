"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { fetchThemeAdmin, saveTheme } from "@/lib/admin-api";
import { DEFAULT_THEME, type Theme } from "@/lib/api";

const COLOR_FIELDS: { key: keyof Theme["colors"]; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" }
];

function ThemeEditor() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchThemeAdmin()
      .then(setTheme)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await saveTheme(theme);
    setSaving(false);
    setSaved(true);
    // Re-apply immediately so the admin can preview without a full reload elsewhere
    location.reload();
  }

  if (loading) return <p className="text-ink/60">Loading…</p>;

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="flex max-w-md flex-1 flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">Shop name</span>
          <input
            value={theme.shopName}
            onChange={(e) => setTheme({ ...theme, shopName: e.target.value })}
            className="rounded-lg border border-black/10 px-4 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">Tagline</span>
          <input
            value={theme.tagline}
            onChange={(e) => setTheme({ ...theme, tagline: e.target.value })}
            className="rounded-lg border border-black/10 px-4 py-2"
          />
        </label>

        <h2 className="mt-4 font-display text-lg font-semibold text-ink">Colors</h2>
        {COLOR_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">{label}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.colors[key]}
                onChange={(e) =>
                  setTheme({ ...theme, colors: { ...theme.colors, [key]: e.target.value } })
                }
                className="h-9 w-9 cursor-pointer rounded border border-black/10"
              />
              <input
                value={theme.colors[key]}
                onChange={(e) =>
                  setTheme({ ...theme, colors: { ...theme.colors, [key]: e.target.value } })
                }
                className="w-24 rounded-lg border border-black/10 px-2 py-1 text-sm"
              />
            </div>
          </label>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save theme"}
        </button>
      </div>

      <div
        className="flex-1 rounded-2xl p-8 shadow-inner"
        style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
      >
        <p className="mb-2 text-xs uppercase tracking-wide opacity-60">Live preview</p>
        <h3 className="mb-2 text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          {theme.shopName}
        </h3>
        <p className="mb-4">{theme.tagline}</p>
        <button
          className="rounded-full px-4 py-2 font-semibold text-white"
          style={{ backgroundColor: theme.colors.primary }}
        >
          Add to cart
        </button>
        <span
          className="ml-3 rounded-full px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: theme.colors.accent }}
        >
          Featured
        </span>
      </div>
    </div>
  );
}

export default function ThemePage() {
  return (
    <AdminGuard>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Theme &amp; branding</h1>
      <ThemeEditor />
    </AdminGuard>
  );
}

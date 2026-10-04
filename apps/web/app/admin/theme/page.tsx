"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import {
  fetchThemeAdmin,
  fetchThemeHistoryAdmin,
  restoreThemeAdmin,
  saveTheme
} from "@/lib/admin-api";
import { DEFAULT_THEME, type Theme, type ThemeHistoryEntry } from "@/lib/api";

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
  const [history, setHistory] = useState<ThemeHistoryEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [currentTheme, themeHistory] = await Promise.all([
          fetchThemeAdmin(),
          fetchThemeHistoryAdmin()
        ]);
        setTheme(currentTheme);
        setHistory(themeHistory);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to load theme settings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await saveTheme(theme);
      setHistory(await fetchThemeHistoryAdmin());
      setSaved(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save theme.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(entry: ThemeHistoryEntry) {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      setTheme(await restoreThemeAdmin(entry.id));
      setHistory(await fetchThemeHistoryAdmin());
      setSaved(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to restore theme.");
    } finally {
      setSaving(false);
    }
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
        {error && <p className="text-sm text-red-700">{error}</p>}

        <section className="mt-4 border-t border-black/10 pt-5">
          <h2 className="font-display text-lg font-semibold text-ink">Theme history</h2>
          <p className="mt-1 text-sm text-ink/60">
            Your five most recently replaced themes are saved here.
          </p>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">No previous themes yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{entry.theme.shopName}</p>
                    <p className="text-xs text-ink/60">
                      {new Intl.DateTimeFormat("nl-NL", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(new Date(entry.createdAt))}
                    </p>
                    <div className="mt-2 flex gap-1" aria-label={`Colors for ${entry.theme.shopName}`}>
                      {Object.values(entry.theme.colors).map((color) => (
                        <span
                          key={color}
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(entry)}
                    disabled={saving}
                    className="rounded-full border border-primary px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
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

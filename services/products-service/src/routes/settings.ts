import { Router } from "express";
import { store } from "../db";
import { requireAdmin } from "../middleware/auth";

export const settingsRouter = Router();

// GET /settings/theme - public, used by the storefront to render the CMS-configured theme
settingsRouter.get("/theme", async (_req, res, next) => {
  try {
    res.json(await store.getTheme());
  } catch (error) {
    next(error);
  }
});

settingsRouter.get("/theme/history", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await store.getThemeHistory());
  } catch (error) {
    next(error);
  }
});

// PUT /settings/theme - admin only, used by the CMS to change colors/branding
settingsRouter.put("/theme", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.setTheme(req.body));
  } catch (error) {
    next(error);
  }
});

settingsRouter.post("/theme/history/:id/restore", requireAdmin, async (req, res, next) => {
  const historyId = Number(req.params.id);
  if (!Number.isSafeInteger(historyId) || historyId < 1) {
    return res.status(400).json({ error: "Invalid theme history ID" });
  }

  try {
    const theme = await store.restoreTheme(historyId);
    if (!theme) return res.status(404).json({ error: "Theme history entry not found" });
    res.json(theme);
  } catch (error) {
    next(error);
  }
});

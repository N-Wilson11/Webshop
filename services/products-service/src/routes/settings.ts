import { Router } from "express";
import { store } from "../db";
import { requireAdmin } from "../middleware/auth";

export const settingsRouter = Router();

// GET /settings/theme - public, used by the storefront to render the CMS-configured theme
settingsRouter.get("/theme", (_req, res) => {
  res.json(store.getTheme());
});

// PUT /settings/theme - admin only, used by the CMS to change colors/branding
settingsRouter.put("/theme", requireAdmin, (req, res) => {
  const theme = store.setTheme(req.body);
  res.json(theme);
});

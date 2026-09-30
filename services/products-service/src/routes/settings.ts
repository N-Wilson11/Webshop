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

// PUT /settings/theme - admin only, used by the CMS to change colors/branding
settingsRouter.put("/theme", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.setTheme(req.body));
  } catch (error) {
    next(error);
  }
});

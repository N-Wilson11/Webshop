import { Request, Response, NextFunction } from "express";

/**
 * Simple bearer-token auth for admin/CMS write operations.
 * Set ADMIN_TOKEN in the environment; requests must send `Authorization: Bearer <token>`.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = process.env.ADMIN_TOKEN || "admin-secret";
  const header = req.headers.authorization || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (provided !== token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

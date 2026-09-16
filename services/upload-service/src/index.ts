import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "./middleware/auth";

export const app = express();

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error("Unsupported file type. Use png, jpeg, webp or gif."));
      return;
    }
    cb(null, true);
  }
});

app.use(cors());
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "upload-service" }));

app.post("/upload", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });

  const publicBase = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4002}`;
  const url = `${publicBase}/uploads/${req.file.filename}`;
  res.status(201).json({ url, filename: req.file.filename });
});

// Multer/file errors surface here
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: err.message });
  }
);

if (require.main === module) {
  const PORT = process.env.PORT || 4002;
  app.listen(PORT, () => {
    console.log(`upload-service listening on port ${PORT}`);
  });
}

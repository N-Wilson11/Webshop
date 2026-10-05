import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "./middleware/auth";
import { metrics, observeRequests } from "./metrics";

export const app = express();

const localUploadsDir = process.env.UPLOADS_DIR;
const bucketName = "product-images";
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const extensionsByMimeType: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

if (localUploadsDir && !fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured");
  }

  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

async function saveToSupabase(file: Express.Multer.File, filename: string): Promise<string> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/storage/v1/object/${bucketName}/${filename}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": file.mimetype,
      "x-upsert": "false"
    },
    body: file.buffer
  });

  if (!response.ok) {
    throw new Error(`Supabase could not save the image (${response.status})`);
  }

  return `${url}/storage/v1/object/public/${bucketName}/${filename}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error("Unsupported file type. Use png, jpeg, webp or gif."));
      return;
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(observeRequests);
if (localUploadsDir) app.use("/uploads", express.static(localUploadsDir));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "upload-service" }));
app.get("/metrics", metrics);

app.post("/upload", requireAdmin, upload.single("image"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });

  try {
    const filename = `${randomUUID()}${extensionsByMimeType[req.file.mimetype]}`;
    const url = localUploadsDir
      ? (() => {
          fs.writeFileSync(path.join(localUploadsDir, filename), req.file!.buffer);
          const publicBase =
            process.env.PUBLIC_URL ||
            process.env.RENDER_EXTERNAL_URL ||
            `http://localhost:${process.env.PORT || 4002}`;
          return `${publicBase}/uploads/${filename}`;
        })()
      : await saveToSupabase(req.file, filename);

    res.status(201).json({ url, filename });
  } catch (error) {
    next(error);
  }
});

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const isClientError =
      err instanceof multer.MulterError || err.message === "Unsupported file type. Use png, jpeg, webp or gif.";
    if (!isClientError) console.error("Upload request failed", err);
    res.status(isClientError ? 400 : 500).json({
      error: isClientError ? err.message : "Image upload failed"
    });
  }
);

if (require.main === module) {
  const port = Number(process.env.PORT) || 4002;
  app.listen(port, "0.0.0.0", () => {
    console.log(`upload-service listening on port ${port}`);
  });
}

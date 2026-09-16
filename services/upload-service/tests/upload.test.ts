import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import { app } from "../src/index";

const ADMIN_TOKEN = "test-admin-token";
const tmpDir = path.join(__dirname, "tmp-uploads");

describe("upload-service", () => {
  afterAll(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("responds healthy", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("rejects upload without admin token", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("image", Buffer.from("fake-image-data"), "cookie.png");
    expect(res.status).toBe(401);
  });

  it("uploads an image with admin token", async () => {
    const res = await request(app)
      .post("/upload")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .attach("image", Buffer.from("fake-image-data"), "cookie.png");
    expect(res.status).toBe(201);
    expect(res.body.url).toContain("/uploads/");
  });

  it("rejects unsupported file types", async () => {
    const res = await request(app)
      .post("/upload")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .attach("image", Buffer.from("not-an-image"), "cookie.txt");
    expect(res.status).toBe(400);
  });
});

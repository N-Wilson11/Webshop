import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index";

const ADMIN_TOKEN = "test-admin-token";

describe("products-service", () => {
  it("responds healthy", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("lists seeded products", async () => {
    const res = await request(app).get("/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("rejects product creation without admin token", async () => {
    const res = await request(app).post("/products").send({ name: "Test Cookie", price: 1 });
    expect(res.status).toBe(401);
  });

  it("creates, updates and deletes a product with admin token", async () => {
    const create = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .send({ name: "Snickerdoodle", price: 2.75, category: "cookies", stock: 10 });
    expect(create.status).toBe(201);
    expect(create.body.name).toBe("Snickerdoodle");
    const id = create.body.id;

    const update = await request(app)
      .put(`/products/${id}`)
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .send({ price: 3.25 });
    expect(update.status).toBe(200);
    expect(update.body.price).toBe(3.25);

    const del = await request(app)
      .delete(`/products/${id}`)
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
    expect(del.status).toBe(204);

    const getMissing = await request(app).get(`/products/${id}`);
    expect(getMissing.status).toBe(404);
  });

  it("returns 404 for unknown product", async () => {
    const res = await request(app).get("/products/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("gets and updates theme settings", async () => {
    const get = await request(app).get("/settings/theme");
    expect(get.status).toBe(200);
    expect(get.body.colors.primary).toBeDefined();

    const put = await request(app)
      .put("/settings/theme")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .send({ ...get.body, colors: { ...get.body.colors, primary: "#000000" } });
    expect(put.status).toBe(200);
    expect(put.body.colors.primary).toBe("#000000");
  });
});

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
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "choc-chip", imageUrl: "/images/chocolate-chip.png" }),
        expect.objectContaining({ id: "pineapple-upside-down", imageUrl: "/images/pineapple-upside-down.png" }),
        expect.objectContaining({ id: "brownies", imageUrl: "/images/brownies.png" }),
        expect.objectContaining({ id: "cocada", imageUrl: "/images/cocada.png" })
      ])
    );
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

  it("reserves stock atomically and rejects quantities that are unavailable", async () => {
    const reserve = await request(app)
      .post("/products/reserve-stock")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .send({ items: [{ id: "choc-chip", quantity: 2 }] });
    expect(reserve.status).toBe(204);

    const product = await request(app).get("/products/choc-chip");
    expect(product.body.stock).toBe(48);

    const unavailable = await request(app)
      .post("/products/reserve-stock")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .send({ items: [{ id: "choc-chip", quantity: 49 }] });
    expect(unavailable.status).toBe(409);
    expect(unavailable.body.error).toMatch(/no longer available/i);
  });

  it("gets, updates, and restores theme settings from history", async () => {
    const get = await request(app).get("/settings/theme");
    expect(get.status).toBe(200);
    expect(get.body.colors.primary).toBeDefined();
    expect(get.body.iconUrl).toBe("/icon.svg");

    const put = await request(app)
      .put("/settings/theme")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
      .send({ ...get.body, colors: { ...get.body.colors, primary: "#000000" } });
    expect(put.status).toBe(200);
    expect(put.body.colors.primary).toBe("#000000");

    const history = await request(app)
      .get("/settings/theme/history")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
    expect(history.status).toBe(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].theme.colors.primary).toBe(get.body.colors.primary);

    const restore = await request(app)
      .post(`/settings/theme/history/${history.body[0].id}/restore`)
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
    expect(restore.status).toBe(200);
    expect(restore.body.colors.primary).toBe(get.body.colors.primary);
  });
});

import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp, getSenderName } from "../src/index";

const order = {
  email: "customer@example.com",
  name: "Cookie Customer",
  items: [{ name: "Chocolate Chip", quantity: 2, price: 2.5, currency: "EUR" }],
  totalPrice: 5,
  currency: "EUR"
};

describe("mail-service", () => {
  it("uses the display name from the configured sender", () => {
    expect(getSenderName("The Cookie Company <orders@example.com>")).toBe("The Cookie Company");
    expect(getSenderName("orders@example.com")).toBe("orders");
  });

  it("responds healthy", async () => {
    const app = createApp(vi.fn());
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("sends valid order confirmations", async () => {
    const sendOrderConfirmation = vi.fn().mockResolvedValue(undefined);
    const app = createApp(sendOrderConfirmation);
    const response = await request(app).post("/order-confirmations").send(order);

    expect(response.status).toBe(202);
    expect(sendOrderConfirmation).toHaveBeenCalledWith(order);
  });

  it("rejects invalid order confirmations", async () => {
    const app = createApp(vi.fn());
    const response = await request(app).post("/order-confirmations").send({ email: "invalid" });

    expect(response.status).toBe(400);
  });
});

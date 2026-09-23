import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { buildOrderConfirmationEmail, createApp, createBrevoMailer, getSenderName } from "../src/index";

const order = {
  email: "customer@example.com",
  name: "Cookie Customer",
  items: [{ name: "Chocolate Chip", quantity: 2, price: 2.5, currency: "EUR" }],
  totalPrice: 5,
  currency: "EUR"
};

describe("mail-service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the display name from the configured sender", () => {
    expect(getSenderName("The Cookie Company <orders@example.com>")).toBe("The Cookie Company");
    expect(getSenderName("orders@example.com")).toBe("orders");
  });

  it("sends order confirmations through the Brevo API", async () => {
    const previousApiKey = process.env.BREVO_API_KEY;
    const previousFrom = process.env.MAIL_FROM;
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.MAIL_FROM = "Cookie Corner <orders@example.com>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    try {
      await createBrevoMailer()(order);

      expect(fetch).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/smtp/email",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "api-key": "test-api-key" })
        })
      );
      expect(JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)).toMatchObject({
        sender: { email: "orders@example.com", name: "Cookie Corner" },
        to: [{ email: order.email, name: order.name }]
      });
    } finally {
      process.env.BREVO_API_KEY = previousApiKey;
      process.env.MAIL_FROM = previousFrom;
    }
  });

  it("reports Brevo API failures", async () => {
    const previousApiKey = process.env.BREVO_API_KEY;
    const previousFrom = process.env.MAIL_FROM;
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.MAIL_FROM = "orders@example.com";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "Unauthorized" }));

    try {
      await expect(createBrevoMailer()(order)).rejects.toThrow("Brevo email API returned 401: Unauthorized");
    } finally {
      process.env.BREVO_API_KEY = previousApiKey;
      process.env.MAIL_FROM = previousFrom;
    }
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

  it("renders the product image from its public URL", async () => {
    const { html } = await buildOrderConfirmationEmail(
      {
        ...order,
        items: [{ ...order.items[0], imageUrl: "https://cdn.example.com/cookie.png" }]
      },
      "Cookie Corner"
    );

    expect(html).toContain('src="https://cdn.example.com/cookie.png"');
    expect(html).toContain('alt="Chocolate Chip"');
  });

  it("resolves relative image URLs against PUBLIC_WEB_URL", async () => {
    const previous = process.env.PUBLIC_WEB_URL;
    process.env.PUBLIC_WEB_URL = "https://shop.example.com";

    try {
      const { html } = await buildOrderConfirmationEmail(
        {
          ...order,
          items: [{ ...order.items[0], imageUrl: "/images/chocolate-chip.png" }]
        },
        "Cookie Corner"
      );

      expect(html).toContain('src="https://shop.example.com/images/chocolate-chip.png"');
    } finally {
      process.env.PUBLIC_WEB_URL = previous;
    }
  });

  it("falls back to a cookie emoji placeholder when no image is available", async () => {
    const { html } = await buildOrderConfirmationEmail(order, "Cookie Corner");

    expect(html).not.toContain("<img");
    expect(html).toContain("🍪");
  });
});

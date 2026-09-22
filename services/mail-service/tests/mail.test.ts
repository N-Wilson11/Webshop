import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp, getSenderName, buildOrderConfirmationEmail } from "../src/index";

const order = {
  email: "customer@example.com",
  name: "Cookie Customer",
  items: [{ name: "Chocolate Chip", quantity: 2, price: 2.5, currency: "EUR" }],
  totalPrice: 5,
  currency: "EUR"
};

function mockFetchImage(contentType = "image/png") {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => contentType },
      arrayBuffer: async () => bytes.buffer
    })
  );
  return bytes;
}

describe("mail-service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("embeds the product image as an inline attachment", async () => {
    mockFetchImage();

    const { html, attachments } = await buildOrderConfirmationEmail(
      {
        ...order,
        items: [{ ...order.items[0], imageUrl: "https://cdn.example.com/cookie.png" }]
      },
      "Cookie Corner"
    );

    expect(attachments).toHaveLength(1);
    expect(attachments[0].cid).toBe("item-image-0");
    expect(html).toContain('src="cid:item-image-0"');
    expect(html).toContain('alt="Chocolate Chip"');
  });

  it("resolves relative image URLs against PUBLIC_WEB_URL before fetching", async () => {
    mockFetchImage();
    const previous = process.env.PUBLIC_WEB_URL;
    process.env.PUBLIC_WEB_URL = "https://shop.example.com";

    try {
      await buildOrderConfirmationEmail(
        {
          ...order,
          items: [{ ...order.items[0], imageUrl: "/images/chocolate-chip.png" }]
        },
        "Cookie Corner"
      );

      expect(fetch).toHaveBeenCalledWith(
        "https://shop.example.com/images/chocolate-chip.png",
        expect.anything()
      );
    } finally {
      process.env.PUBLIC_WEB_URL = previous;
    }
  });

  it("falls back to a cookie emoji placeholder when no image is available", async () => {
    const { html, attachments } = await buildOrderConfirmationEmail(order, "Cookie Corner");

    expect(attachments).toHaveLength(0);
    expect(html).not.toContain("<img");
    expect(html).toContain("🍪");
  });

  it("falls back to the placeholder when the image cannot be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const { html, attachments } = await buildOrderConfirmationEmail(
      {
        ...order,
        items: [{ ...order.items[0], imageUrl: "https://cdn.example.com/missing.png" }]
      },
      "Cookie Corner"
    );

    expect(attachments).toHaveLength(0);
    expect(html).not.toContain("<img");
    expect(html).toContain("🍪");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { createMolliePayment } from "../lib/mollie";

const order = {
  name: "Cookie Customer",
  email: "customer@example.com",
  address: "Cookie Street 1",
  items: [{ id: "chocolate-chip", name: "Chocolate Chip", quantity: 2, price: 2.5, currency: "EUR" }],
  totalPrice: 5,
  currency: "EUR"
};

describe("Mollie payments", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("creates a payment with verified return and webhook URLs", async () => {
    vi.stubEnv("MOLLIE_API_KEY", "test_example");
    vi.stubEnv("APP_URL", "https://shop.example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "tr_example",
          status: "open",
          _links: { checkout: { href: "https://www.mollie.com/checkout/test" } }
        })
      })
    );

    const payment = await createMolliePayment(order, "00000000-0000-0000-0000-000000000001");

    expect(payment.id).toBe("tr_example");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.mollie.com/v2/payments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test_example" })
      })
    );
    expect(JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)).toMatchObject({
      amount: { currency: "EUR", value: "5.00" },
      redirectUrl: "https://shop.example.com/checkout/complete?order_id=00000000-0000-0000-0000-000000000001",
      webhookUrl: "https://shop.example.com/api/payments/mollie/webhook",
      metadata: { order_id: "00000000-0000-0000-0000-000000000001" }
    });
  });
});

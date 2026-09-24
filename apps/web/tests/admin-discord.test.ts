import { afterEach, describe, expect, it, vi } from "vitest";
import { sendAdminOrderDiscordNotification } from "../lib/admin-discord";

const order = {
  name: "Cookie Customer",
  email: "customer@example.com",
  address: "Cookie Street 1",
  items: [{ name: "Chocolate Chip", quantity: 2, price: 2.5, currency: "EUR" }],
  totalPrice: 5,
  currency: "EUR"
};

describe("admin Discord notifications", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends new orders to the configured Discord webhook", async () => {
    vi.stubEnv("DISCORD_ORDER_WEBHOOK_URL", "https://discord.com/api/webhooks/123/token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    await sendAdminOrderDiscordNotification(order);

    expect(fetch).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/123/token",
      expect.objectContaining({ method: "POST" })
    );
    expect(JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)).toMatchObject({
      username: "Cookie Corner Orders",
      embeds: [
        {
          title: "New order received",
          fields: expect.arrayContaining([
            expect.objectContaining({ name: "Customer", value: "Cookie Customer\ncustomer@example.com" }),
            expect.objectContaining({ name: "Items", value: "2x Chocolate Chip" })
          ])
        }
      ]
    });
  });
});

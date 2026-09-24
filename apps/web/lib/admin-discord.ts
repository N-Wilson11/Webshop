import type { OrderSubmission } from "./order-types";

function getWebhookUrl() {
  const webhookUrl = process.env.DISCORD_ORDER_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("DISCORD_ORDER_WEBHOOK_URL must be configured for admin order notifications");
  }

  const url = new URL(webhookUrl);
  if (
    url.protocol !== "https:" ||
    !["discord.com", "discordapp.com"].includes(url.hostname) ||
    !url.pathname.startsWith("/api/webhooks/")
  ) {
    throw new Error("DISCORD_ORDER_WEBHOOK_URL must be a Discord HTTPS webhook URL");
  }

  return webhookUrl;
}

export async function sendAdminOrderDiscordNotification(order: OrderSubmission) {
  const total = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency
  }).format(order.totalPrice);
  const items = order.items
    .map((item) => `${item.quantity}x ${item.name}`)
    .join("\n")
    .slice(0, 1024);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(getWebhookUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Cookie Corner Orders",
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "New order received",
            color: 9133628,
            fields: [
              { name: "Customer", value: `${order.name}\n${order.email}`, inline: true },
              { name: "Total", value: total, inline: true },
              { name: "Items", value: items },
              { name: "Delivery address", value: order.address.slice(0, 1024) }
            ]
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Discord order webhook returned ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

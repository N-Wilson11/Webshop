import cors from "cors";
import express, { type Request, type Response } from "express";
import nodemailer from "nodemailer";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  currency: string;
};

type OrderConfirmation = {
  email: string;
  name: string;
  items: OrderItem[];
  totalPrice: number;
  currency: string;
};

export type SendOrderConfirmation = (order: OrderConfirmation) => Promise<void>;

function isOrderConfirmation(value: unknown): value is OrderConfirmation {
  if (!value || typeof value !== "object") return false;

  const order = value as Record<string, unknown>;
  return (
    typeof order.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email) &&
    typeof order.name === "string" &&
    order.name.trim().length > 0 &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as OrderItem).name === "string" &&
        Number.isInteger((item as OrderItem).quantity) &&
        (item as OrderItem).quantity > 0 &&
        Number.isFinite((item as OrderItem).price) &&
        (item as OrderItem).price >= 0 &&
        typeof (item as OrderItem).currency === "string"
    ) &&
    Number.isFinite(order.totalPrice) &&
    (order.totalPrice as number) >= 0 &&
    typeof order.currency === "string"
  );
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character];
  });
}

export function getSenderName(from: string) {
  const displayName = from.match(/^\s*(.*?)\s*<[^>]+>\s*$/)?.[1];
  if (displayName) return displayName.replace(/^["']|["']$/g, "").trim();

  return from.split("@")[0].trim();
}

export function createSmtpMailer(): SendOrderConfirmation {
  const smtpUrl = process.env.SMTP_URL;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM;

  if (!from || (!smtpUrl && !(smtpHost && smtpUser && smtpPassword))) {
    throw new Error(
      "MAIL_FROM and either SMTP_URL or SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured"
    );
  }

  const transport =
    smtpHost && smtpUser && smtpPassword
      ? nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === "465",
          auth: {
            user: smtpUser,
            pass: smtpPassword
          }
        })
      : nodemailer.createTransport(smtpUrl as string);
  const senderName = getSenderName(from);

  return async (order) => {
    const itemRows = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #eadfd5; color: #3a2618; font-size: 15px; line-height: 22px;">${escapeHtml(item.name)}</td>
            <td align="center" style="padding: 14px 12px; border-bottom: 1px solid #eadfd5; color: #705c50; font-size: 15px; line-height: 22px;">${item.quantity}</td>
            <td align="right" style="padding: 14px 0; border-bottom: 1px solid #eadfd5; color: #3a2618; font-size: 15px; font-weight: 600; line-height: 22px; white-space: nowrap;">${formatPrice(item.price * item.quantity, item.currency)}</td>
          </tr>`
      )
      .join("");
    const total = formatPrice(order.totalPrice, order.currency);

    await transport.sendMail({
      from,
      to: order.email,
      subject: `Order confirmed — ${senderName}`,
      text: `Hello ${order.name},\n\nThank you for your order!\n\n${order.items
        .map((item) => `${item.quantity} x ${item.name} — ${formatPrice(item.price * item.quantity, item.currency)}`)
        .join("\n")}\n\nTotal: ${total}\n\nWe are preparing your cookies now.\n\nWith love,\n${senderName}`,
      html: `<!doctype html>
<html lang="en">
  <body style="margin: 0; padding: 0; background-color: #fff8f0; color: #3a2618; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff8f0; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(58, 38, 24, 0.1);">
            <tr>
              <td style="padding: 32px 40px; background-color: #8b5e3c; text-align: center;">
                <p style="margin: 0 0 8px; color: #f4b942; font-size: 30px; line-height: 36px;">🍪</p>
                <p style="margin: 0; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: bold; line-height: 34px;">${escapeHtml(senderName)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 16px; color: #3a2618; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; line-height: 34px;">Your order is confirmed!</p>
                <p style="margin: 0 0 28px; color: #705c50; font-size: 16px; line-height: 25px;">Hello ${escapeHtml(order.name)},<br>Thank you for your order. We are preparing your freshly baked cookies now.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                  <thead>
                    <tr>
                      <th align="left" style="padding: 0 0 10px; border-bottom: 2px solid #8b5e3c; color: #8b5e3c; font-size: 12px; letter-spacing: 0.8px; line-height: 18px; text-transform: uppercase;">Item</th>
                      <th align="center" style="padding: 0 12px 10px; border-bottom: 2px solid #8b5e3c; color: #8b5e3c; font-size: 12px; letter-spacing: 0.8px; line-height: 18px; text-transform: uppercase;">Qty</th>
                      <th align="right" style="padding: 0 0 10px; border-bottom: 2px solid #8b5e3c; color: #8b5e3c; font-size: 12px; letter-spacing: 0.8px; line-height: 18px; text-transform: uppercase;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                  <tr>
                    <td style="color: #3a2618; font-size: 18px; font-weight: bold; line-height: 28px;">Total</td>
                    <td align="right" style="color: #8b5e3c; font-size: 22px; font-weight: bold; line-height: 28px;">${total}</td>
                  </tr>
                </table>
                <div style="margin-top: 32px; padding: 20px 24px; background-color: #fff8f0; border-radius: 10px;">
                  <p style="margin: 0; color: #705c50; font-size: 14px; line-height: 22px;">We will send another update when your delicious cookies are on their way.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 40px; background-color: #f8f0e8; text-align: center;">
                <p style="margin: 0; color: #705c50; font-size: 13px; line-height: 20px;">Baked with love at ${escapeHtml(senderName)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
    });
  };
}

export function createApp(sendOrderConfirmation: SendOrderConfirmation) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "mail-service" }));

  app.post("/order-confirmations", async (req: Request, res: Response) => {
    if (!isOrderConfirmation(req.body)) {
      res.status(400).json({ error: "A valid order confirmation payload is required" });
      return;
    }

    try {
      await sendOrderConfirmation(req.body);
      res.status(202).json({ status: "sent" });
    } catch (error) {
      console.error("Unable to send order confirmation email", error);
      res.status(502).json({ error: "Unable to send order confirmation email" });
    }
  });

  return app;
}

let mailer: SendOrderConfirmation | undefined;
const app = createApp(async (order) => {
  if (!mailer) mailer = createSmtpMailer();
  await mailer(order);
});
export { app };

if (require.main === module) {
  const port = process.env.PORT || 4003;
  app.listen(port, () => {
    console.log(`mail-service listening on port ${port}`);
  });
}

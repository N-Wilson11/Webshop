import cors from "cors";
import express, { type Request, type Response } from "express";
import nodemailer from "nodemailer";

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  currency: string;
  imageUrl?: string;
};

export type Theme = {
  shopName: string;
  iconUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
};

export type OrderConfirmation = {
  email: string;
  name: string;
  items: OrderItem[];
  totalPrice: number;
  currency: string;
  theme?: Theme;
};

export type SendOrderConfirmation = (order: OrderConfirmation) => Promise<void>;

const defaultTheme: Theme = {
  shopName: "Cookie Corner",
  iconUrl: "",
  colors: {
    primary: "#8B5E3C",
    secondary: "#F4B942",
    accent: "#D96C4C",
    background: "#FFF8F0",
    text: "#3A2618"
  }
};

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
        typeof (item as OrderItem).currency === "string" &&
        ((item as OrderItem).imageUrl === undefined || typeof (item as OrderItem).imageUrl === "string")
    ) &&
    Number.isFinite(order.totalPrice) &&
    (order.totalPrice as number) >= 0 &&
    typeof order.currency === "string" &&
    (order.theme === undefined || isTheme(order.theme))
  );
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

function resolveImageUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  const base = process.env.PUBLIC_WEB_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/${imageUrl.replace(/^\//, "")}`;
}

function isTheme(value: unknown): value is Theme {
  if (!value || typeof value !== "object") return false;

  const theme = value as Record<string, unknown>;
  const colors = theme.colors as Record<string, unknown> | undefined;
  return (
    typeof theme.shopName === "string" &&
    typeof theme.iconUrl === "string" &&
    !!colors &&
    ["primary", "secondary", "accent", "background", "text"].every(
      (color) => typeof colors[color] === "string"
    )
  );
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

function getSenderEmail(from: string) {
  return from.match(/<([^>]+)>/)?.[1].trim() || from.trim();
}

export async function buildOrderConfirmationEmail(order: OrderConfirmation, senderName: string) {
  const theme = order.theme || defaultTheme;
  const brandName = theme.shopName || senderName;
  const colors = Object.fromEntries(
    Object.entries(theme.colors).map(([key, value]) => [key, escapeHtml(value)])
  ) as Theme["colors"];
  const iconUrl = resolveImageUrl(theme.iconUrl);
  const brandIcon = iconUrl
    ? `<img src="${escapeHtml(iconUrl)}" alt="" width="48" height="48" style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" />`
    : "";
  const itemRows = order.items
    .map((item) => {
      const imageUrl = resolveImageUrl(item.imageUrl);
      const imageCell = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}" width="56" height="56" style="display: block; width: 56px; height: 56px; border-radius: 10px; object-fit: cover;" />`
        : `<div style="width: 56px; height: 56px; border-radius: 10px; background-color: ${colors.background}; text-align: center; line-height: 56px; color: ${colors.text}; font-size: 11px;">Image unavailable</div>`;

      return `<tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #eadfd5;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width: 56px; padding-right: 12px; vertical-align: middle;">${imageCell}</td>
                  <td style="vertical-align: middle; color: ${colors.text}; font-size: 15px; line-height: 22px;">${escapeHtml(item.name)}</td>
                </tr>
              </table>
            </td>
            <td align="center" style="padding: 14px 12px; border-bottom: 1px solid #eadfd5; color: ${colors.text}; font-size: 15px; line-height: 22px;">${item.quantity}</td>
            <td align="right" style="padding: 14px 0; border-bottom: 1px solid #eadfd5; color: ${colors.text}; font-size: 15px; font-weight: 600; line-height: 22px; white-space: nowrap;">${formatPrice(item.price * item.quantity, item.currency)}</td>
          </tr>`;
    })
    .join("");
  const total = formatPrice(order.totalPrice, order.currency);

  return {
    subject: `Order confirmed — ${brandName}`,
    text: `Hello ${order.name},\n\nThank you for your order!\n\n${order.items
      .map((item) => `${item.quantity} x ${item.name} — ${formatPrice(item.price * item.quantity, item.currency)}`)
      .join("\n")}\n\nTotal: ${total}\n\nWe are preparing your cookies now.\n\nWith love,\n${brandName}`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin: 0; padding: 0; background-color: ${colors.background}; color: ${colors.text}; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${colors.background}; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(58, 38, 24, 0.1);">
            <tr>
              <td style="padding: 32px 40px; background-color: ${colors.primary}; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 30px; line-height: 36px;">${brandIcon}</p>
                <p style="margin: 0; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: bold; line-height: 34px;">${escapeHtml(brandName)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 16px; color: ${colors.text}; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; line-height: 34px;">Your order is confirmed!</p>
                <p style="margin: 0 0 28px; color: ${colors.text}; font-size: 16px; line-height: 25px;">Hello ${escapeHtml(order.name)},<br>Thank you for your order. We are preparing your freshly baked cookies now.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                  <thead>
                    <tr>
                      <th align="left" style="padding: 0 0 10px; border-bottom: 2px solid ${colors.primary}; color: ${colors.primary}; font-size: 12px; letter-spacing: 0.8px; line-height: 18px; text-transform: uppercase;">Item</th>
                      <th align="center" style="padding: 0 12px 10px; border-bottom: 2px solid ${colors.primary}; color: ${colors.primary}; font-size: 12px; letter-spacing: 0.8px; line-height: 18px; text-transform: uppercase;">Qty</th>
                      <th align="right" style="padding: 0 0 10px; border-bottom: 2px solid ${colors.primary}; color: ${colors.primary}; font-size: 12px; letter-spacing: 0.8px; line-height: 18px; text-transform: uppercase;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                  <tr>
                    <td style="color: ${colors.text}; font-size: 18px; font-weight: bold; line-height: 28px;">Total</td>
                    <td align="right" style="color: ${colors.primary}; font-size: 22px; font-weight: bold; line-height: 28px;">${total}</td>
                  </tr>
                </table>
                <div style="margin-top: 32px; padding: 20px 24px; background-color: ${colors.background}; border-radius: 10px;">
                  <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 22px;">We will send another update when your delicious cookies are on their way.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 40px; background-color: ${colors.secondary}; text-align: center;">
                <p style="margin: 0; color: ${colors.text}; font-size: 13px; line-height: 20px;">Baked with love at ${escapeHtml(brandName)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  };
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
    const email = await buildOrderConfirmationEmail(order, senderName);

    await transport.sendMail({
      from,
      to: order.email,
      subject: email.subject,
      text: email.text,
      html: email.html
    });
  };
}

export function createBrevoMailer(): SendOrderConfirmation {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("BREVO_API_KEY and MAIL_FROM must be configured");
  }

  const senderName = getSenderName(from);
  const senderEmail = getSenderEmail(from);

  return async (order) => {
    const email = await buildOrderConfirmationEmail(order, senderName);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: order.email, name: order.name }],
        subject: email.subject,
        textContent: email.text,
        htmlContent: email.html,
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Brevo email API returned ${response.status}: ${responseText}`);
    }
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
  if (!mailer) mailer = process.env.BREVO_API_KEY ? createBrevoMailer() : createSmtpMailer();
  await mailer(order);
});
export { app };

if (require.main === module) {
  const port = process.env.PORT || 4003;
  app.listen(port, () => {
    console.log(`mail-service listening on port ${port}`);
  });
}

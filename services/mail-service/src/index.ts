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
  return async (order) => {
    const itemRows = order.items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${formatPrice(item.price * item.quantity, item.currency)}</td></tr>`
      )
      .join("");

    await transport.sendMail({
      from,
      to: order.email,
      subject: "Your Cookie Corner order confirmation",
      text: `Hello ${order.name},\n\nThank you for your order!\n\n${order.items
        .map((item) => `${item.quantity} x ${item.name} — ${formatPrice(item.price * item.quantity, item.currency)}`)
        .join("\n")}\n\nTotal: ${formatPrice(order.totalPrice, order.currency)}`,
      html: `<h1>Thank you for your order!</h1><p>Hello ${escapeHtml(order.name)},</p><p>We are preparing your cookies.</p><table><thead><tr><th>Item</th><th>Quantity</th><th>Subtotal</th></tr></thead><tbody>${itemRows}</tbody></table><p><strong>Total: ${formatPrice(order.totalPrice, order.currency)}</strong></p>`
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

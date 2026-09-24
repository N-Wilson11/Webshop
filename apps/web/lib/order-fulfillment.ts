import { sendAdminOrderDiscordNotification } from "./admin-discord";
import { getMolliePayment } from "./mollie";
import { markOrderPaid } from "./orders";

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || "http://localhost:4003";

export async function verifyAndFulfillMolliePayment(paymentId: string) {
  const payment = await getMolliePayment(paymentId);

  if (payment.status !== "paid") {
    return payment.status;
  }

  await fulfillPaidOrder(payment.id);
  return payment.status;
}

export async function fulfillPaidOrder(paymentId: string) {
  const order = await markOrderPaid(paymentId);
  if (!order) {
    return;
  }

  try {
    const response = await fetch(`${MAIL_SERVICE_URL}/order-confirmations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Mail service returned ${response.status}`);
    }
  } catch (error) {
    console.error(`Order confirmation email failed for payment ${paymentId}`, error);
  }

  try {
    await sendAdminOrderDiscordNotification(order);
  } catch (error) {
    console.error(`Discord order notification failed for payment ${paymentId}`, error);
  }
}

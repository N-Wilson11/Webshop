# Cookie Webshop

A full-stack cookie webshop built with Next.js and three Node.js microservices.

**Live demo:** [webshop-web-six.vercel.app](https://webshop-web-six.vercel.app/)

## Features

- Product catalogue, shopping cart, and checkout flow
- Branded order confirmation emails sent through Brevo
- CMS for managing products, images, and shop theme settings
- Docker Compose setup for local development
- Render Blueprint for deploying the backend services
- GitHub Actions checks for tests, linting, and production builds

## Run with Docker

Requirements:

- Docker Desktop running with the Linux engine
- PowerShell, Command Prompt, or a terminal opened in this repository

From the repository root, run:

```powershell
docker compose up -d --build
```

Open the webshop at:

- Webshop: http://localhost:3000
- Products API: http://localhost:4001
- Upload API: http://localhost:4002


Stop the application:

```powershell
docker compose down
```

Product data and uploaded files are stored in Docker volumes and remain available after containers are stopped.
The default product images are versioned static assets in `apps/web/public/images`; seeded product
records use `/images/<filename>` URLs served by the web app.

## Configuration

Copy `.env.example` to `.env` if you need to override the defaults:


Available variables:

- `ADMIN_TOKEN`: shared token used by the admin product and upload APIs
- `SUPABASE_URL`: Supabase project URL used by the server to store orders
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key used only by the server to store and list orders
- `DISCORD_ORDER_WEBHOOK_URL`: Discord webhook URL used for new-order notifications
- `MOLLIE_API_KEY`: Mollie Test API key used to create checkout payments
- `APP_URL`: public storefront URL used by Mollie for the payment return and webhook
- `PAYMENT_PROVIDER`: `mock` (default) for local test payments or `mollie` for Mollie Test Mode
- `NEXT_PUBLIC_PRODUCTS_API_URL`: products API URL used by the browser
- `NEXT_PUBLIC_UPLOAD_API_URL`: upload API URL used by the browser
- `UPLOAD_PUBLIC_URL`: public URL returned for uploaded files
- `BREVO_API_KEY`: Brevo Transactional Email API key used to deliver order confirmations over HTTPS
- `SMTP_URL`: fallback SMTP connection URL used only when `BREVO_API_KEY` is not configured
- `MAIL_FROM`: sender address displayed on order confirmations

Reserved URL characters in the SMTP login or key (such as `@`, `:`, `/`, and `#`) must be
percent-encoded in `SMTP_URL`.

For deployed environments, use a Brevo Transactional Email API key:

```env
BREVO_API_KEY=your-brevo-api-key
MAIL_FROM=Cookie Corner <your-verified-sender@example.com>
```

When `BREVO_API_KEY` is unset, the service supports the existing separate SMTP variables as a fallback.

## Store orders in Supabase

1. Create a Supabase project and run
   [`supabase/migrations/20260924_create_orders.sql`](supabase/migrations/20260924_create_orders.sql)
   in its SQL Editor.
2. Run [`supabase/migrations/20260924_add_mollie_payment_status.sql`](supabase/migrations/20260924_add_mollie_payment_status.sql)
   in the Supabase SQL Editor.
3. In Vercel, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TOKEN`, and
   `DISCORD_ORDER_WEBHOOK_URL` as Production environment variables. `ADMIN_TOKEN` must match the
   token configured on the products service.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` and `DISCORD_ORDER_WEBHOOK_URL` server-only. Do not create
   `NEXT_PUBLIC_` versions of them.

Checkout initially stores an open order while the customer pays in Mollie. After Mollie confirms
the payment, the order is marked as paid, the customer receives its confirmation email, and the
admin is notified through Discord. A failed Discord alert is logged but does not undo a paid order.
Signed-in admins can view all paid orders at `/admin/orders`.

## Test payments

`PAYMENT_PROVIDER=mock` is the default and requires no payment-provider account. It simulates a
paid checkout and runs the same paid-order, email, and Discord flow, but must never be used for
real sales.

To use Mollie Test Mode later, set `PAYMENT_PROVIDER=mollie`, then add a **Test API key** as
`MOLLIE_API_KEY` and set `APP_URL` to the public Vercel URL. Test keys begin with `test_` and do
not charge money. Mollie's webhook needs a publicly reachable URL, so local Docker URLs and
`localhost` cannot receive Mollie webhooks. Orders, confirmation emails, and Discord notifications
are created only after Mollie reports the payment as paid.

## Product images in order emails

Set `PUBLIC_WEB_URL` to the public Vercel URL of the storefront in the mail-service environment.
Email clients load product images from this URL, so `localhost` and Docker service names such as
`http://web:3000` only work inside Docker and cannot be displayed by recipients. For local email
testing, use a public tunnel URL or the deployed Vercel URL.

## Deploy services to Render

The included [`render.yaml`](render.yaml) Blueprint creates the products, upload, and mail services
from the `main` branch. In the Render Dashboard, select **New +** → **Blueprint**, connect this
repository, and confirm the three services.

During setup, enter:

- The **same** strong `ADMIN_TOKEN` for both the products and upload services. Use that token to
  sign in to the CMS.
- Your Brevo API key in `BREVO_API_KEY` and verified sender in `MAIL_FROM`.

After Render deploys each service, copy its public URL. Add the following values to the Vercel
project's Production environment variables, then redeploy the web project:

```env
NEXT_PUBLIC_PRODUCTS_API_URL=https://your-products-service.onrender.com
PRODUCTS_API_URL=https://your-products-service.onrender.com
NEXT_PUBLIC_UPLOAD_API_URL=https://your-upload-service.onrender.com
MAIL_SERVICE_URL=https://your-mail-service.onrender.com
```

Render free services spin down after inactivity and have ephemeral storage. Product edits and
uploaded images can be lost after a redeploy or restart; use persistent storage for production.

## Deploy the web app to Vercel

Import this repository into Vercel and set the project root directory to `apps/web`. Configure the
following Production environment variables with the public URLs of your deployed Render services:

```env
NEXT_PUBLIC_PRODUCTS_API_URL=https://your-products-service.onrender.com
PRODUCTS_API_URL=https://your-products-service.onrender.com
NEXT_PUBLIC_UPLOAD_API_URL=https://your-upload-service.onrender.com
MAIL_SERVICE_URL=https://your-mail-service.onrender.com
```

Redeploy after changing an environment variable. Do not use `localhost` or Docker service names in
Vercel because they are not reachable from the deployed application.
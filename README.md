# Cookie Webshop

A full-stack cookie webshop built with Next.js and three Node.js microservices.

**Live demo:** [webshop-web-six.vercel.app](https://webshop-web-six.vercel.app/)

(Cold start takes a few seconds. Once all services are running it's fast.)

## Features

- Product catalogue, shopping cart, and checkout flow
- Branded order confirmation emails sent through Brevo
- CMS for managing products, images, and shop theme settings
- Docker Compose setup for local development
- Render Blueprint for deploying the backend services
- GitHub Actions checks for tests, linting, and production builds
- AI store assistant grounded only in the live shop catalogue and theme

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

Product data, theme settings, and uploaded product images are stored in Supabase. Before starting
Docker for the first time, configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` and
run the Supabase migrations described below. The default product images are versioned static assets
in `apps/web/public/images`; seeded product records use `/images/<filename>` URLs served by the web
app.

## Configuration

Copy `.env.example` to `.env` if you need to override the defaults:


Available variables:

- `ADMIN_TOKEN`: shared token used by the admin product and upload APIs
- `SUPABASE_URL`: Supabase project URL used by server services to store orders, products, theme settings, and images
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key used only by server services to access Supabase
- `DISCORD_ORDER_WEBHOOK_URL`: Discord webhook URL used for new-order notifications
- `NEXT_PUBLIC_PRODUCTS_API_URL`: products API URL used by the browser
- `NEXT_PUBLIC_UPLOAD_API_URL`: upload API URL used by the browser
- `UPLOAD_PUBLIC_URL`: public URL returned for uploaded files
- `BREVO_API_KEY`: Brevo Transactional Email API key used to deliver order confirmations over HTTPS
- `SMTP_URL`: fallback SMTP connection URL used only when `BREVO_API_KEY` is not configured
- `MAIL_FROM`: sender address displayed on order confirmations
- `GEMINI_API_KEY`: server-only Google Gemini key for the store assistant
- `GEMINI_CHAT_MODEL`: optional Gemini chat model (defaults to `gemini-3.8-flash`)
- `OPENAI_API_KEY`: optional server-only OpenAI fallback key for the store assistant
- `OPENAI_CHAT_MODEL`: optional OpenAI fallback model (defaults to `gpt-4o-mini`)

Reserved URL characters in the SMTP login or key (such as `@`, `:`, `/`, and `#`) must be
percent-encoded in `SMTP_URL`.

For deployed environments, use a Brevo Transactional Email API key:

```env
BREVO_API_KEY=your-brevo-api-key
MAIL_FROM=Cookie Corner <your-verified-sender@example.com>
```

When `BREVO_API_KEY` is unset, the service supports the existing separate SMTP variables as a fallback.

## Store assistant

The floating **Ask us** button sends questions to a server-side Gemini integration. Each request
fetches the current shop name, tagline, and product catalogue and instructs the model to answer
only from that data. Questions that are not supported by the website content are answered as
unknown; the browser never receives the provider key. If `GEMINI_API_KEY` is not set, the app can
use the optional OpenAI fallback.

For `npm run dev`, add `GEMINI_API_KEY` to `apps/web/.env.local` and restart the Next.js server.
For Docker Compose, add it to the repository-root `.env` and recreate the web container with
`docker compose up -d --build web`. In Vercel, add it as a Production environment variable and
redeploy. Optionally set `GEMINI_CHAT_MODEL`; it defaults to `gemini-3.8-flash`.

## Store orders and products in Supabase

1. Create a Supabase project and run the migrations in [`supabase/migrations`](supabase/migrations)
   in the SQL Editor, beginning with `20260924_create_orders.sql` and then
   `20260930_create_products_and_store_settings.sql`, and then
   `20260930_create_product_images_bucket.sql`.
2. In Vercel, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TOKEN`, and
   `DISCORD_ORDER_WEBHOOK_URL` as Production environment variables. `ADMIN_TOKEN` must match the
   token configured on the products service.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` and `DISCORD_ORDER_WEBHOOK_URL` server-only. Do not create
   `NEXT_PUBLIC_` versions of them.

Checkout saves an order only after its confirmation email was accepted by the mail service. It then
stores the order and notifies the admin through Discord. A failed Discord alert is logged but does
not undo a completed order. Signed-in admins can view all saved orders at `/admin/orders`. Product
creation, edits, deletion, image URLs, stock, category, and theme settings are also stored in
Supabase, so they persist across products-service restarts and deployments.

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

Render free services spin down after inactivity. Product edits and uploaded product images are
stored in Supabase and survive restarts and redeployments.

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

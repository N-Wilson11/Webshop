# Webshop

Cookie webshop built with Next.js and two Node.js microservices.

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

Check the containers:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs -f
```

Stop the application:

```powershell
docker compose down
```

Product data and uploaded files are stored in Docker volumes and remain available after containers are stopped.

## Configuration

Copy `.env.example` to `.env` if you need to override the defaults:

```powershell
Copy-Item .env.example .env
```

Available variables:

- `ADMIN_TOKEN`: shared token used by the admin product and upload APIs
- `NEXT_PUBLIC_PRODUCTS_API_URL`: products API URL used by the browser
- `NEXT_PUBLIC_UPLOAD_API_URL`: upload API URL used by the browser
- `UPLOAD_PUBLIC_URL`: public URL returned for uploaded files

The default Docker configuration uses `admin-secret` and localhost URLs for the published APIs.

## Local development without Docker

Install dependencies from the repository root:

```powershell
npm install
```

Run the services in separate terminals:

```powershell
npm run dev:products
npm run dev:upload
npm run dev
```

The web application runs at http://localhost:3000.

## Tests

Run all workspace tests:

```powershell
npm test
```

Run the linter:

```powershell
npm run lint
```

## Troubleshooting

### Docker cannot connect to the engine

Start Docker Desktop and wait until the Linux engine is running, then retry:

```powershell
docker compose up -d --build
```

### The web build appears stuck at `npm install`

The web app has its own `apps/web/package-lock.json`. Rebuild without stale build cache:

```powershell
docker compose build --no-cache web
docker compose up -d
```

### No containers appear

Containers are created after all images build successfully. Inspect the build and service status with:

```powershell
docker compose build --progress=plain
docker compose ps -a
docker compose logs
```

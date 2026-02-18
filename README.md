# Reportr

Reportr is a civic engagement progressive web application that enables citizens to anonymously report and track public infrastructure issues in Pretoria, South Africa, with advanced geospatial tracking and comprehensive mobile support.

## Features

- Anonymous issue reporting system
- Geospatial tracking of infrastructure problems
- Support existing issues to increase their priority
- Mobile-first design with PWA capabilities
- Offline functionality with background synchronization
- Multi-language support for all 11 official South African languages

## n8n Backend Architecture

The Reportr Node API now acts as an **anonymous proxy** to n8n workflows.

Expected n8n webhook paths under `N8N_WEBHOOK_BASE_URL`:

- `GET /health`
- `GET /issues`
- `GET /issues/nearby?lat=<>&lng=<>&radius=<>`
- `GET /issues/:id`
- `POST /issues`
- `POST /issues/:id/support`
- `GET /issues/:id/support/:deviceId`
- `DELETE /issues/:id/support`

All action payloads sent by the app are anonymous and include `anonymous: true` request context metadata.

## Rocky Linux 8 VPS deployment (Docker)

Use `docker-compose.rocky8.yml` to run the full stack on a Rocky 8 VPS:

- `app` (Reportr web + API container)
- `n8n` (workflow backend)
- `postgres` (persistent relational data)
- `minio` + `minio-init` (object capture/storage for images and media)

### 1) Prerequisites

- Rocky Linux 8 server
- Docker Engine + Docker Compose plugin installed
- Ports opened as needed (typically `5000`, optionally `5678`, `9000`, `9001`)

### 2) Environment file

Create a deployment `.env` from the template:

```bash
cp .env.rocky8.example .env
```

Then set secure values for at least:

- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `N8N_ENCRYPTION_KEY`
- `N8N_AUTH_TOKEN`

### 3) Start the stack

```bash
docker compose -f docker-compose.rocky8.yml --env-file .env up -d --build
```

### 4) Verify services

```bash
docker compose -f docker-compose.rocky8.yml ps
```

- Reportr app: `http://<VPS-IP>:5000`
- n8n UI: `http://<VPS-IP>:5678`
- MinIO API: `http://<VPS-IP>:9000`
- MinIO Console: `http://<VPS-IP>:9001`

### 5) Stop services

```bash
docker compose -f docker-compose.rocky8.yml down
```

To also remove volumes/data (dangerous):

```bash
docker compose -f docker-compose.rocky8.yml down -v
```

## Development Setup

For local development:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` and configure keys.

3. Start development server:
   ```bash
   npm run dev
   ```

4. App URL: `http://localhost:5000`

## Build for production

```bash
npm run build
```

## License

[MIT](LICENSE)

# GitHub Security Scanner

A web-based GitHub repository security scanner. Paste a GitHub repo URL and it clones the repo and runs [gitleaks](https://github.com/gitleaks/gitleaks) to detect leaked secrets, API keys, and credentials.

## Architecture

- **Frontend** -- Next.js app (`frontend/`) with a single API route that proxies scan requests
- **Scanner** -- Express microservice (`scanners/gitleaks/`) running inside Docker, performs the actual clone + scan

The frontend never touches repos directly. All cloning and scanning happens inside an isolated Docker container.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/) 22+

## Getting started

**1. Start the scanner container (This is only for first time cloning the repo):**

```bash
docker compose up -d
```

Wait for the health check to pass (~10s). Verify with:

```bash
curl http://localhost:3001/health
```

**2. Start the frontend:**

MUST CHECK BEFORE RUNNING NPM RUN DEV

1. npm install in frontend
2. Add ``.env`` in frontend with the credentials
3. Add ``scanner-invoker-key.json`` in root with the proper credentials
4. Stupid mistake I made but make sure all localhost3000 proccess are killed

Then you can run

```bash
npm run dev
```

**3. Open http://localhost:3000**, paste a GitHub repo URL, and hit Scan.

## Project structure

```
├── docker-compose.yml          # Runs the scanner container
├── bin/
│   └── gitleaks                # Pre-built gitleaks binary
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Scan UI
│   │   └── api/scan/route.ts   # Proxies to scanner service
│   └── lib/types.ts            # Shared TypeScript types
└── scanners/
    └── gitleaks/
        ├── Dockerfile          # node:22-slim + git + gitleaks
        └── src/index.ts        # Express server (POST /scan, GET /health)
```
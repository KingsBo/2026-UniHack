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

**1. Start the scanner container:**

```bash
docker compose up -d
```

Wait for the health check to pass (~10s). Verify with:

```bash
curl http://localhost:3001/health
```

**2. Start the frontend:**

```bash
cd frontend
npm install
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

## API

### `POST /api/scan`

Request:
```json
{ "repoUrl": "https://github.com/owner/repo" }
```

Response:
```json
{
  "findings": [
    {
      "RuleID": "aws-access-key",
      "Description": "AWS Access Key",
      "File": "config.py",
      "StartLine": 12,
      "Secret": "AKIA...",
      "Commit": "abc123...",
      "Author": "jane",
      "Date": "2024-10-20T14:40:36Z",
      "Fingerprint": "..."
    }
  ],
  "summary": { "total": 1, "repo": "https://github.com/owner/repo" }
}
```

## Adding more scanners

To add semgrep or trivy, create a new directory under `scanners/` following the same pattern (Dockerfile + Express server), add it to `docker-compose.yml`, and add a `SEMGREP_SERVICE_URL` / `TRIVY_SERVICE_URL` env var to the frontend proxy.

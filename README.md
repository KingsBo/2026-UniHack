# Repository Vulnerability Scanner

A comprehensive tool for scanning repositories for security vulnerabilities using multiple open-source scanners.

## Features

- GitHub OAuth integration for secure repository access
- Multiple vulnerability scanners:
  - Semgrep (static analysis)
  - Gitleaks (secret detection)
  - Trivy (dependency scanning)
- Web dashboard for viewing scan results
- RESTful API for managing scans and repositories

## Project Structure

```
project/
├── src/
│   ├── backend/     # Express.js API server
│   ├── frontend/    # React + Vite application
│   └── scanner/     # Scanner tools and scripts
└── scripts/         # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- GitHub OAuth App credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd src/backend && npm install
   cd ../frontend && npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

### Running the Application

**Backend:**
```bash
cd src/backend
npm run dev
```

**Frontend:**
```bash
cd src/frontend
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT


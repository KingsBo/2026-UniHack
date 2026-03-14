FROM node:22-slim AS builder

WORKDIR /app
COPY scanners/gitleaks/package.json scanners/gitleaks/package-lock.json ./
RUN npm ci
COPY scanners/gitleaks/tsconfig.json ./
COPY scanners/gitleaks/src/ src/
RUN npx tsc

FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates curl \
    && curl -sSL https://github.com/gitleaks/gitleaks/releases/download/v8.30.0/gitleaks_8.30.0_linux_x64.tar.gz \
       | tar xz -C /usr/local/bin gitleaks \
    && chmod +x /usr/local/bin/gitleaks \
    && apt-get purge -y curl && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]

FROM node:22-slim AS builder

WORKDIR /app
COPY scanners/trivy/package.json scanners/trivy/package-lock.json ./
RUN npm ci
COPY scanners/trivy/tsconfig.json ./
COPY scanners/trivy/src/ src/
RUN npx tsc

FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

COPY bin/trivy /usr/local/bin/trivy
RUN chmod +x /usr/local/bin/trivy

RUN trivy fs --download-db-only

WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "dist/index.js"]

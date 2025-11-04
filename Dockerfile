# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base

# Install Chromium and required libs for Puppeteer
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
     chromium \
     ca-certificates \
     fonts-liberation \
     libasound2 \
     libatk-bridge2.0-0 \
     libatk1.0-0 \
     libdrm2 \
     libxkbcommon0 \
     libxcomposite1 \
     libxdamage1 \
     libxfixes3 \
     libxrandr2 \
     libgbm1 \
     libgtk-3-0 \
     libpango-1.0-0 \
     libnss3 \
     libxshmfence1 \
     libxss1 \
     libx11-xcb1 \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_PATH=/usr/bin/chromium \
    PORT=8080

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

RUN npm run build \
  && npm prune --omit=dev

EXPOSE 8080

CMD ["node", "dist/index.js"]



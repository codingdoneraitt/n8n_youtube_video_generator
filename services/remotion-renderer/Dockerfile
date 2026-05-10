FROM node:26-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock*.json ./
COPY services/remotion-renderer/package.json services/remotion-renderer/package.json
RUN npm ci

COPY remotion remotion
COPY services/remotion-renderer services/remotion-renderer
WORKDIR /app/services/remotion-renderer
RUN npm run build

ENV NODE_ENV=production
RUN mkdir -p /data/artifacts && chown -R node:node /app /data
USER node
EXPOSE 3030
CMD ["node", "dist/server.js"]

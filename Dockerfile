FROM node:22.22.3-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY scripts ./scripts
COPY apps/web/primeng-license.example.ts apps/web/primeng-license.example.ts
RUN npm ci
COPY . .
RUN npm run build

FROM build AS api-deps
RUN npm prune --omit=dev --ignore-scripts

FROM base AS api
ENV NODE_ENV=production
WORKDIR /app
COPY --from=api-deps /app/node_modules ./node_modules
COPY apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]

FROM nginx:1.28-alpine AS web
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist/web/browser /usr/share/nginx/html
EXPOSE 80

FROM build AS railway
ENV NODE_ENV=production SERVE_WEB=true IMPORT_LOG_DIR=/tmp/product-finder-import
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]

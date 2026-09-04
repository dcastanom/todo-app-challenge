# syntax=docker/dockerfile:1
# Multi-stage build for the Express API. Run from the repo root:
#   docker build -f backend/Dockerfile -t todo-backend .

FROM node:22-alpine AS base
WORKDIR /app
# Workspace manifests only — keeps `npm ci` layers cached across source changes.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY e2e/package.json ./e2e/

FROM base AS deps
RUN npm ci

FROM base AS prod-deps
RUN npm ci --omit=dev

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY backend ./backend
RUN npm run build:shared \
  && npm run build --workspace backend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tini
# Production deps + the workspace symlink for @todo/shared.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/drizzle ./backend/drizzle
COPY --from=build /app/backend/package.json ./backend/package.json
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "--"]
# Apply migrations then start. Override with `node backend/dist/db/migrate.js` for a one-off.
CMD ["sh", "-c", "node backend/dist/db/migrate.js && node backend/dist/index.js"]

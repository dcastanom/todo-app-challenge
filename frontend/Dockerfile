# syntax=docker/dockerfile:1
# Builds the React app and serves the static bundle with nginx.
# Run from the repo root:
#   docker build -f frontend/Dockerfile \
#     --build-arg VITE_API_BASE_URL=/api/v1 -t todo-frontend .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY e2e/package.json ./e2e/
RUN npm ci
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY frontend ./frontend
# Baked into the bundle at build time.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build:shared \
  && npm run build --workspace frontend

FROM nginx:1.27-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

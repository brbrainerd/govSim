FROM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@latest
ENV PNPM_MANAGE_PACKAGE_MANAGER_VERSIONS=false
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json vite.config.ts index.html ./
COPY data ./data
COPY src ./src
RUN pnpm build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
ARG GOVSIM_CODE_VERSION=unknown
ENV GOVSIM_CODE_VERSION=$GOVSIM_CODE_VERSION
EXPOSE 80
HEALTHCHECK --interval=5s --timeout=3s --start-period=2s --retries=3 CMD wget -qO- http://127.0.0.1:80/api/health >/dev/null || exit 1

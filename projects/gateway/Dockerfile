FROM node:22.11.0-slim AS base
WORKDIR /app
RUN corepack enable
RUN corepack use pnpm@9.15.2+sha512.93e57b0126f0df74ce6bff29680394c0ba54ec47246b9cf321f0121d8d9bb03f750a705f24edc3c1180853afd7c2c3b94196d0a3d53d3e069d9e2793ef11f321

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.pnpm to speed up subsequent builds.
# Leverage a bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.pnpm \
    pnpm install

# Copy the rest of the source files into the image
COPY . .


FROM base AS dev
# Expose the port that the application listens on
EXPOSE 8080

# Run the application. We're using docker compose for env vars so unset the
# .env file.
CMD node scripts/startApp.mjs

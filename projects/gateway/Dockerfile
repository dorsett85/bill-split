FROM node:22.15.0-slim AS base
WORKDIR /app
RUN corepack enable
RUN corepack use pnpm@10.13.1+sha512.37ebf1a5c7a30d5fabe0c5df44ee8da4c965ca0c5af3dbab28c3a1681b70a256218d05c81c9c0dcf767ef6b8551eb5b960042b9ed4300c59242336377e01cfad

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

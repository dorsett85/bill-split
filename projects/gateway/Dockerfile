FROM node:22.11.0-slim AS base
WORKDIR /app
RUN corepack enable
RUN corepack use pnpm@9.14.2+sha512.6e2baf77d06b9362294152c851c4f278ede37ab1eba3a55fda317a4a17b209f4dbb973fb250a77abc463a341fcb1f17f17cfa24091c4eb319cda0d9b84278387

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

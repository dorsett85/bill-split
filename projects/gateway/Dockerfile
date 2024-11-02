FROM node:20.18.0-slim AS base
WORKDIR /app
RUN corepack enable
RUN corepack use pnpm@9.12.3+sha1.4fb96925d434c491285182acf29803bb9aa2e6e5

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

# Run the application
CMD pnpm start

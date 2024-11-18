FROM node:20.18.0-slim AS base
WORKDIR /app
RUN corepack enable
RUN corepack use pnpm@9.13.2+sha512.88c9c3864450350e65a33587ab801acf946d7c814ed1134da4a924f6df5a2120fd36b46aab68f7cd1d413149112d53c7db3a4136624cfd00ff1846a0c6cef48a

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

# Run the migrations
CMD pnpm migrate

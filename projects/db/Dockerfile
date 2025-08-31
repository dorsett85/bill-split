FROM node:22.15.0-slim AS base
WORKDIR /app
RUN corepack enable
RUN corepack use pnpm@10.15.0+sha512.486ebc259d3e999a4e8691ce03b5cac4a71cbeca39372a9b762cb500cfdf0873e2cb16abe3d951b1ee2cf012503f027b98b6584e4df22524e0c7450d9ec7aa7b

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

# Run the application
CMD pnpm migrate

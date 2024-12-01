FROM node:22.11.0-slim AS base
WORKDIR /app
RUN corepack enable
RUN corepack use pnpm@9.14.4+sha512.c8180b3fbe4e4bca02c94234717896b5529740a6cbadf19fa78254270403ea2f27d4e1d46a08a0f56c89b63dc8ebfd3ee53326da720273794e6200fcf0d184ab

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
CMD pnpm initialize

FROM public.ecr.aws/lambda/nodejs:22 AS builder
WORKDIR /usr/app

RUN corepack enable
RUN corepack use pnpm@9.15.1+sha512.1acb565e6193efbebda772702950469150cf12bcc764262e7587e71d19dc98a423dff9536e57ea44c49bdf790ff694e83c27be5faa23d67e0c033b583be4bfcf

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.pnpm to speed up subsequent builds.
# Leverage a bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.pnpm \
    pnpm install

# Copy the rest of the source files into the image
COPY package.json index.ts  ./

RUN pnpm run build

FROM public.ecr.aws/lambda/nodejs:22
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist/* ./
CMD ["index.handler"]

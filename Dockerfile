FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm exec playwright install --with-deps chromium
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
ENV VSI_DOWNLOAD_DIR=/data/downloads
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=build /app /app
COPY --from=build /root/.cache/ms-playwright /ms-playwright
RUN mkdir -p /data/downloads && chown -R node:node /app /data /ms-playwright
USER node
EXPOSE 3000
VOLUME ["/data/downloads"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["pnpm","--filter","@vsi/web","start"]

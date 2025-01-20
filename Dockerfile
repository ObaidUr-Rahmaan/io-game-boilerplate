FROM node:18-slim AS builder
RUN npm install -g pnpm

WORKDIR /app
COPY server/package.json server/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY server/tsconfig.json ./
COPY server/src ./src
RUN pnpm build

FROM node:18-slim AS runner
RUN npm install -g pnpm

WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./

ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/server.js"] 
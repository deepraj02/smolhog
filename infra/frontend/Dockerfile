FROM oven/bun:1.2.18-alpine AS base
WORKDIR /app
COPY package*.json bun.lock* ./

FROM base AS development
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3000
ENV NODE_ENV=development
CMD ["bun", "run", "dev"]

FROM base AS builder
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.2.18-alpine AS production
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
RUN bun install --frozen-lockfile --production
EXPOSE 3000
ENV NODE_ENV=production
CMD ["bun", "start"]

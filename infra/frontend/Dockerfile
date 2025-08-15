FROM oven/bun:canary-alpine as base

WORKDIR /app

COPY package*.json ./
RUN bun install

# Development stage
FROM base as development
COPY . .
EXPOSE 3000
CMD ["bun", "run", "dev"]

# Production stage
FROM base as production
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "start"]
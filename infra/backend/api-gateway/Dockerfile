FROM oven/bun:1.2.18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN bun install

FROM base
COPY . .
EXPOSE 3001
CMD ["bun", "run", "dev"]


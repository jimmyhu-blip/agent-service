FROM oven/bun:1 AS base
WORKDIR /app

# 安裝依賴
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# 執行
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

ENV NODE_ENV=production
EXPOSE 3210

CMD ["bun", "run", "src/index.ts"]

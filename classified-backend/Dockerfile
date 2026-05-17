# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate && npm run build

# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# Install prod deps + keep prisma CLI + tsx for seeding
RUN npm ci --omit=dev && \
    npm install prisma tsx --no-save --prefer-offline 2>/dev/null || \
    npm install prisma tsx --no-save

# Copy generated Prisma client (platform-native binary from build stage)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY --from=builder /app/dist ./dist

# Entrypoint: run migrations then start server
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

RUN mkdir -p uploads

EXPOSE 5000
CMD ["./entrypoint.sh"]

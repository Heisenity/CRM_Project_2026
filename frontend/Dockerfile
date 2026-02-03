# ---------- Stage 1: deps ----------
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# ---------- Stage 2: builder ----------
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BACKEND_URL=https://mediainfotech.org/api/v1/

RUN rm -rf .next
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 🔑 Copy EVERYTHING Next needs (no cherry-picking)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# ✅ CORRECT ENTRYPOINT
CMD ["node", ".next/standalone/server.js"]

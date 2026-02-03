# ---------- Stage 1: deps (install deps) ----------
FROM node:20-slim AS deps
WORKDIR /app
# Copy only package files to install deps (speed)
COPY package.json package-lock.json* ./ 
# If you use pnpm/yarn, adjust accordingly
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# ---------- Stage 2: builder (build the Next app) ----------
FROM node:20-slim AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source
COPY . .

# Important build-time envs - set the production backend you want baked-in.
# Replace with your production backend if different.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BACKEND_URL="https://mediainfotech.org/api/v1/"

# Ensure previous build artifacts are removed
RUN rm -rf .next || true

# Run the Next build (this will produce .next/standalone and .next/static)
RUN npm run build

# ---------- Stage 3: runtime (minimal) ----------
FROM node:20-slim AS runner
WORKDIR /app

# Create a non-root user for safety
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy the standalone server and its package.json etc.
COPY --from=builder /app/.next/standalone ./

# Copy node_modules required by the standalone server (critical)
# the standalone output expects modules accessible at ./node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy the compiled static assets and the public folder
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# If you have any other runtime files (e.g. .next/standalone/package.json extra files),
# they are already included by copying the standalone folder above.

# Ensure runtime node env (you can override these when running container)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Set ownership so the non-root user can read all files
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Start the standalone server created by next
CMD ["node", "server.js"]

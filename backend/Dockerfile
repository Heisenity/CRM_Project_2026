FROM node:18-slim

# Install system deps (Chromium + SSL)
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-freefont-ttf \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Better npm reliability
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000

COPY package*.json ./
RUN npm install

COPY . .

# 🔑 Prisma MUST be generated in the same OS
RUN npx prisma generate

RUN npm run build
RUN npm prune --production

RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 5000
CMD ["npm", "start"]

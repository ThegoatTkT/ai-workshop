FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install SQLite tools and Playwright dependencies for Chromium
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright globally and download Chromium browser
RUN npm install -g @playwright/test \
    && npx playwright install chromium \
    && npx playwright install-deps chromium

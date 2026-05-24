# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests (no pnpm-workspace.yaml — doesn't exist in this project)
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app (standalone output)
RUN pnpm build

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

# Install ALL Alpine dependencies that headless Chromium needs.
# Without these, Chromium will fail to launch with cryptic errors.
# Based on Playwright's official Alpine Docker image requirements.
RUN apk add --no-cache \
    # Chromium browser
    chromium \
    # Network security
    ca-certificates \
    nss \
    # Font rendering (needed for page.textContent(), screenshot, etc.)
    freetype \
    harfbuzz \
    ttf-freefont \
    fontconfig \
    # C++ standard library (Chromium is a C++ app)
    libstdc++ \
    # X11 libraries (needed even in headless mode for GPU-less rendering)
    libx11 \
    libxcb \
    libxcomposite \
    libxdamage \
    libxext \
    libxfixes \
    libxrandr \
    # Text layout and rendering
    pango \
    cairo \
    pixman \
    expat \
    # Wayland support
    wayland \
    # Misc system utilities
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set Playwright browser path — browser.ts uses this explicitly
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production artifacts from builder
# .next/standalone contains: server.js, package.json, node_modules, .next/*
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ensure the nextjs user can write to /tmp (Chromium's temp directory)
RUN chmod 1777 /tmp

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Drop root privileges
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Use dumb-init to handle signals properly and prevent orphan Chromium processes
CMD ["dumb-init", "node", "server.js"]
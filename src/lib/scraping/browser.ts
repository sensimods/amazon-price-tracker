import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { PageContent } from "./types";

let browser: Browser | null = null;
let browserLaunching: Promise<Browser> | null = null;

/**
 * Resolve the Chromium executable path.
 * Priority:
 *   1. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var (set in Dockerfile)
 *   2. Playwright's default bundled browser (used in dev)
 */
function getExecutablePath(): string | undefined {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  return envPath || undefined;
}

/**
 * Get or create a headless Chromium browser instance.
 * Uses a singleton pattern with deduplication of concurrent launch attempts.
 */
export async function getBrowser(): Promise<Browser> {
  // If already launching, wait for that attempt
  if (browserLaunching) {
    return browserLaunching;
  }

  // If existing browser is connected, reuse it
  if (browser && browser.isConnected()) {
    return browser;
  }

  // Launch a new browser instance
  browserLaunching = (async () => {
    try {
      const executablePath = getExecutablePath();

      browser = await chromium.launch({
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-sync",
          "--disable-translate",
          "--disable-default-apps",
          "--mute-audio",
          "--no-first-run",
          "--hide-scrollbars",
          "--single-process", // Required in Alpine environments without proper IPC
        ],
      });

      return browser;
    } finally {
      browserLaunching = null;
    }
  })();

  return browserLaunching;
}

/**
 * Close the browser instance and release resources.
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close();
    } catch {
      // Browser may already be dead — ignore
    }
    browser = null;
  }
}

/**
 * Fetch the full HTML content of a URL using headless Chromium.
 * Each call creates a fresh context (isolated cookies/storage).
 */
export async function fetchWithBrowser(url: string): Promise<PageContent> {
  const b = await getBrowser();

  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    context = await b.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      // Block unnecessary resources to speed up page loads
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const status = response?.status() ?? 500;

    // Short pause for dynamic content to finish rendering
    await page.waitForTimeout(2000);

    const html = await page.content();

    return { html, url, status };
  } catch (error) {
    // Wrap the error with context for debugging
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Browser fetch failed for ${url}: ${message}`);
  } finally {
    // Always clean up context and page to prevent memory leaks
    if (page) {
      try {
        await page.close();
      } catch {
        // Ignore close errors
      }
    }
    if (context) {
      try {
        await context.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
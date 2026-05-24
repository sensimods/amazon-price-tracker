import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, BrowserContext, Page } from "playwright";
import type { PageContent } from "./types";

// Apply stealth plugin to evade Amazon's bot detection
chromium.use(StealthPlugin());

let browser: Browser | null = null;
let browserLaunching: Promise<Browser> | null = null;

/**
 * Resolve the Chromium executable path.
 * In Docker (production), PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH points to
 * the system-installed Chromium. In dev, Playwright's bundled browser is used.
 */
function getExecutablePath(): string | undefined {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
}

/**
 * Get or create a headless Chromium browser instance.
 * Uses a singleton pattern with deduplication of concurrent launch attempts.
 */
export async function getBrowser(): Promise<Browser> {
  if (browserLaunching) {
    return browserLaunching;
  }

  if (browser && browser.isConnected()) {
    return browser;
  }

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
          "--no-first-run",
          "--no-default-browser-check",
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
 * Uses stealth techniques to avoid bot detection (especially for Amazon).
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
    });

    page = await context.newPage();

    // Use domcontentloaded instead of networkidle — Amazon pages have
    // long-running analytics connections that prevent networkidle from firing
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const status = response?.status() ?? 500;

    // Wait for the page to finish rendering dynamic content
    await page.waitForTimeout(3000);

    // Check if we hit a bot-detection page
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
    if (bodyText.includes("Click the button below to continue shopping")) {
      throw new Error("Amazon bot detection triggered — unable to scrape");
    }

    const html = await page.content();

    return { html, url, status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Browser fetch failed for ${url}: ${message}`);
  } finally {
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
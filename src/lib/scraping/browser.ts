import { chromium, type Browser, type Page } from "playwright";
import type { PageContent } from "./types";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function fetchWithBrowser(url: string): Promise<PageContent> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page: Page = await context.newPage();
  let html: string;
  let status: number;

  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    status = response?.status() ?? 500;

    // Wait a moment for dynamic content to render
    await page.waitForTimeout(2000);

    html = await page.content();
  } finally {
    await page.close();
    await context.close();
  }

  return { html, url, status };
}
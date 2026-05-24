import { resend, FROM_EMAIL } from "./resend";

export async function sendPriceDropAlert(params: {
  to: string;
  productName: string;
  productUrl: string;
  currentPrice: string;
  targetPrice: string;
  store: string | null;
}) {
  const { to, productName, productUrl, currentPrice, targetPrice, store } =
    params;

  const subject = `💰 Price Drop Alert: ${productName} is now ${currentPrice}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 560px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; margin: 0; color: #16a34a;">🎉 Price Drop Alert!</h1>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; margin: 0 0 8px;">${productName}</h2>
        ${store ? `<p style="color: #6b7280; margin: 0 0 8px;">Store: ${store}</p>` : ""}

        <div style="display: flex; gap: 16px; margin: 16px 0;">
          <div style="flex: 1; text-align: center; padding: 12px; background: white; border-radius: 6px;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">Target Price</p>
            <p style="font-size: 20px; font-weight: bold; margin: 0; color: #6b7280;">${targetPrice}</p>
          </div>
          <div style="flex: 1; text-align: center; padding: 12px; background: #f0fdf4; border-radius: 6px;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">Current Price</p>
            <p style="font-size: 20px; font-weight: bold; margin: 0; color: #16a34a;">${currentPrice}</p>
          </div>
        </div>
      </div>

      <a href="${productUrl}" style="display: block; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-bottom: 24px;">
        View Product
      </a>

      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        You received this alert because you set a price target for this product in Price Tracker.
      </p>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
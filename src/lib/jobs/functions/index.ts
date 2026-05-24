import { checkProductPrices } from "./check-products";
import { checkAlerts } from "./send-alerts";

export const functions = [checkProductPrices, checkAlerts];
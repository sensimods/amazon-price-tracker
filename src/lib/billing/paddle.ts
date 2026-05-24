import { Environment, LogLevel, Paddle as PaddleClient } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY ?? "";
const isSandbox = process.env.PADDLE_ENVIRONMENT === "sandbox";

export const paddle = new PaddleClient(apiKey, {
  environment: isSandbox ? Environment.sandbox : Environment.production,
  logLevel: LogLevel.warn,
});

export const PADDLE_PUBLIC_TOKEN =
  process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
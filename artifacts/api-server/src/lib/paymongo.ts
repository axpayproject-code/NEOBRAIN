import { createHmac, timingSafeEqual } from "crypto";
import { fail } from "./workflow-access";
export function verifyPaymongoSignature(
  raw: Buffer,
  header: string,
  secret: string,
  live: boolean,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=")),
  );
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 300)
    return false;
  const signature = parts[live ? "li" : "te"];
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(raw)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export async function paymongo(
  path: string,
  body?: unknown,
  idempotencyKey?: string,
) {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key)
    fail(
      503,
      "Online payments are not configured. Ask the provider about payment or sponsorship.",
    );
  const base =
    process.env.NODE_ENV === "test" && process.env.PAYMONGO_TEST_API_BASE
      ? process.env.PAYMONGO_TEST_API_BASE
      : "https://api.paymongo.com/v1";
  const res = await fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(key + ":").toString("base64")}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const data = (await res.json()) as any;
  if (!res.ok)
    fail(502, "Payment provider request failed. No payment was confirmed.");
  return data.data;
}

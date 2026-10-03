import { endpoint, ident, uid } from "./workflow";
import { Router, raw } from "express";
import { z } from "zod";
import { and, eq, desc, sql } from "drizzle-orm";
import * as S from "@workspace/db";
import {
  manageOrganization,
  fail,
  audit,
  WorkflowError,
} from "../lib/workflow-access";
import { paymongo, verifyPaymongoSignature } from "../lib/paymongo";
const { db } = S;
async function confirmOrder(
  order: typeof S.ordersTable.$inferSelect,
  checkout: any,
) {
  const attrs = checkout.attributes;
  const payments = attrs?.payments ?? [];
  const paid = payments.find((p: any) => p.attributes?.status === "paid");
  if (!paid) return { paid: false };
  const pa = paid.attributes;
  if (pa.amount !== order.amountCentavos || pa.currency !== "PHP")
    fail(409, "Payment amount or currency does not match the order");
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(S.ordersTable)
      .where(eq(S.ordersTable.id, order.id))
      .for("update");
    if (current.status === "paid") return { paid: true };
    if (current.status === "sponsored") {
      await tx
        .update(S.ordersTable)
        .set({ status: "payment_received_cancelled", paymentId: paid.id })
        .where(eq(S.ordersTable.id, current.id));
      return { paid: true, refundRequired: true };
    }
    if (!["pending", "payment_received_cancelled"].includes(current.status))
      return { paid: false };
    if (current.bookingId) {
      const [b] = await tx
        .select()
        .from(S.bookingsTable)
        .where(eq(S.bookingsTable.id, current.bookingId))
        .for("update");
      if (!b) fail(409, "Booking unavailable");
      const expired = b.holdExpiresAt && b.holdExpiresAt < new Date();
      if (b.status === "cancelled" || expired) {
        await tx
          .update(S.ordersTable)
          .set({ status: "payment_received_cancelled", paymentId: paid.id })
          .where(eq(S.ordersTable.id, current.id));
        return { paid: true, refundRequired: true };
      }
      await tx
        .update(S.bookingsTable)
        .set({
          paymentStatus: "paid",
          status: "confirmed",
          holdExpiresAt: null,
        })
        .where(eq(S.bookingsTable.id, b.id));
    }
    if (current.kind === "subscription" && current.organizationId) {
      await tx
        .update(S.organizationsTable)
        .set({
          subscriptionPaidUntil: sql`GREATEST(COALESCE(${S.organizationsTable.subscriptionPaidUntil},now()),now()) + interval '1 month'`,
        })
        .where(eq(S.organizationsTable.id, current.organizationId));
    }
    await tx
      .update(S.ordersTable)
      .set({ status: "paid", paymentId: paid.id })
      .where(eq(S.ordersTable.id, current.id));
    return { paid: true };
  });
}
endpoint("get", "/workflow/orders", async (_req, u) => {
  const rows = await db
    .select()
    .from(S.ordersTable)
    .orderBy(desc(S.ordersTable.createdAt));
  const result = [];
  for (const o of rows) {
    if (o.payerId === u.id || u.role === "superadmin") {
      result.push(o);
      continue;
    }
    if (o.organizationId) {
      try {
        await manageOrganization(u, o.organizationId);
        result.push(o);
      } catch {}
    }
  }
  return result;
});
endpoint("post", "/workflow/orders/:id/checkout", async (req, u) => {
  const [order] = await db
    .select()
    .from(S.ordersTable)
    .where(eq(S.ordersTable.id, uid.parse(req.params.id)));
  if (!order || order.payerId !== u.id) fail(403, "Order payer required");
  if (order.status !== "pending") fail(409, "Pending order required");
  if (
    order.kind === "appointment" &&
    process.env.PAYMONGO_PROVIDER_COLLECTION_APPROVED !== "true"
  )
    fail(
      503,
      "Provider payment collection must be approved and configured before checkout",
    );
  if (order.checkoutUrl) return { checkoutUrl: order.checkoutUrl };
  const origin = process.env.APP_ORIGIN;
  if (!origin || !/^https?:\/\//.test(origin))
    fail(503, "Application origin is not configured");
  const session = await paymongo(
    "/checkout_sessions",
    {
      data: {
        attributes: {
          line_items: [
            {
              amount: order.amountCentavos,
              currency: "PHP",
              name: "NEOBRAIN booked service",
              quantity: 1,
            },
          ],
          payment_method_types: (
            process.env.PAYMONGO_PAYMENT_METHODS ?? "card,gcash,paymaya,qrph"
          ).split(","),
          success_url: `${origin}/${order.kind === "subscription" ? "organization" : "family"}?payment=return`,
          cancel_url: `${origin}/${order.kind === "subscription" ? "organization" : "family"}?payment=cancel`,
          description: `Service order ${order.id}`,
          reference_number: order.id,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
        },
      },
    },
    order.id,
  );
  await db
    .update(S.ordersTable)
    .set({
      checkoutId: session.id,
      checkoutUrl: session.attributes.checkout_url,
    })
    .where(eq(S.ordersTable.id, order.id));
  return { checkoutUrl: session.attributes.checkout_url };
});
endpoint("post", "/workflow/orders/:id/reconcile", async (req, u) => {
  const [o] = await db
    .select()
    .from(S.ordersTable)
    .where(eq(S.ordersTable.id, uid.parse(req.params.id)));
  if (!o) fail(404, "Order unavailable");
  if (o.payerId !== u.id && u.role !== "superadmin") {
    if (!o.organizationId) fail(403, "Order access required");
    await manageOrganization(u, o.organizationId);
  }
  if (!o.checkoutId) fail(409, "Checkout not started");
  return confirmOrder(
    o,
    await paymongo(`/checkout_sessions/${encodeURIComponent(o.checkoutId)}`),
  );
});
endpoint("post", "/workflow/orders/:id/refund", async (req, u) => {
  const [o] = await db
    .select()
    .from(S.ordersTable)
    .where(eq(S.ordersTable.id, uid.parse(req.params.id)));
  if (!o?.organizationId || !o.paymentId) fail(409, "Paid order unavailable");
  await manageOrganization(u, o.organizationId);
  if (!["paid", "payment_received_cancelled"].includes(o.status))
    fail(409, "Refund already requested or order not paid");
  const b = z
    .object({
      reason: z.enum(["requested_by_customer", "duplicate", "fraudulent"]),
    })
    .parse(req.body);
  const refund = await paymongo(
    "/refunds",
    {
      data: {
        attributes: {
          amount: o.amountCentavos,
          payment_id: o.paymentId,
          reason: b.reason,
        },
      },
    },
    `refund-${o.id}`,
  );
  await db
    .update(S.ordersTable)
    .set({ status: "refund_pending", refundId: refund.id })
    .where(eq(S.ordersTable.id, o.id));
  await audit(u.id, "request_refund", "order", o.id);
  return { status: "refund_pending" };
});
endpoint(
  "post",
  "/workflow/organizations/:orgId/subscription-order",
  async (req, u) => {
    const organizationId = ident(req.params.orgId);
    await manageOrganization(u, organizationId);
    const amount = Number(process.env.ORGANIZATION_MONTHLY_FEE_CENTAVOS);
    if (!Number.isSafeInteger(amount) || amount <= 0)
      fail(503, "Organization subscription pricing is not configured");
    const [order] = await db
      .insert(S.ordersTable)
      .values({
        payerId: u.id,
        organizationId,
        kind: "subscription",
        amountCentavos: amount,
      })
      .returning();
    return order;
  },
);
export const paymentWebhookRouter = Router();
paymentWebhookRouter.post(
  "/paymongo",
  raw({ type: "application/json", limit: "1mb" }),
  async (req, res) => {
    try {
      const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
      if (!secret)
        return res.status(503).json({ error: "Webhook is not configured" });
      const key = process.env.PAYMONGO_SECRET_KEY ?? "";
      if (
        !Buffer.isBuffer(req.body) ||
        !verifyPaymongoSignature(
          req.body,
          req.get("Paymongo-Signature") ?? "",
          secret,
          key.startsWith("sk_live"),
        )
      )
        return res.status(401).json({ error: "Invalid signature" });
      const event = JSON.parse(req.body.toString());
      const id = event?.data?.id,
        type = event?.data?.attributes?.type;
      if (typeof id !== "string" || typeof type !== "string")
        return res.status(400).json({ error: "Invalid event" });
      const [done] = await db
        .select()
        .from(S.paymentEventsTable)
        .where(eq(S.paymentEventsTable.id, id));
      if (done) return res.json({ received: true });
      const resource = event.data.attributes.data;
      if (type === "checkout_session.payment.paid") {
        const [o] = await db
          .select()
          .from(S.ordersTable)
          .where(eq(S.ordersTable.checkoutId, resource.id));
        if (o)
          await confirmOrder(
            o,
            await paymongo(
              `/checkout_sessions/${encodeURIComponent(resource.id)}`,
            ),
          );
      } else if (type === "payment.refund.updated") {
        const refund = await paymongo(
          `/refunds/${encodeURIComponent(resource.id)}`,
        );
        if (refund.attributes?.status === "succeeded")
          await db
            .update(S.ordersTable)
            .set({ status: "refunded" })
            .where(eq(S.ordersTable.refundId, resource.id));
      }
      await db
        .insert(S.paymentEventsTable)
        .values({ id, type })
        .onConflictDoNothing();
      return res.json({ received: true });
    } catch (e) {
      req.log.error({ err: e }, "Payment webhook failed");
      return res
        .status(e instanceof WorkflowError ? e.status : 500)
        .json({ error: "Webhook processing failed" });
    }
  },
);

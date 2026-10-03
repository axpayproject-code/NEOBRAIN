import {
  db,
  bookingsTable,
  availabilitySlotsTable,
  auditLogsTable,
  referralsTable,
} from "@workspace/db";
import { and, eq, lt } from "drizzle-orm";
export async function expireBookingHolds() {
  await db.transaction(async (tx) => {
    const expired = await tx
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, "payment_pending"),
          lt(bookingsTable.holdExpiresAt, new Date()),
        ),
      )
      .for("update", { skipLocked: true });
    for (const booking of expired) {
      await tx
        .update(bookingsTable)
        .set({ status: "cancelled" })
        .where(eq(bookingsTable.id, booking.id));
      await tx
        .update(availabilitySlotsTable)
        .set({ status: "available" })
        .where(eq(availabilitySlotsTable.id, booking.slotId));
      if (booking.referralId)
        await tx
          .update(referralsTable)
          .set({ status: "accepted" })
          .where(
            and(
              eq(referralsTable.id, booking.referralId),
              eq(referralsTable.status, "appointment_arranged"),
            ),
          );
      await tx.insert(auditLogsTable).values({
        userId: booking.guardianId,
        action: "booking_hold_expired",
        resourceType: "booking",
        resourceId: String(booking.id),
      });
    }
  });
}

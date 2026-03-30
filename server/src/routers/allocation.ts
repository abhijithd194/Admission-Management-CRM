import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, roleGuard } from '../trpc';
import { allocationSchema } from '../../../shared/schemas';
import db from '../db';

const officerOrAdmin = roleGuard('admin', 'officer');

export const allocationRouter = router({
  list: protectedProcedure.query(() => {
    return db
      .prepare(
        `SELECT al.*, a.fullName as applicantName, a.email as applicantEmail,
                p.name as programName, p.code as programCode
         FROM allocations al
         JOIN applicants a ON al.applicantId = a.id
         JOIN programs p ON al.programId = p.id
         ORDER BY al.allocatedAt DESC`
      )
      .all();
  }),

  allocate: protectedProcedure
    .use(officerOrAdmin)
    .input(allocationSchema)
    .mutation(({ input }) => {
      // Check if applicant already has an allocation
      const existing = db
        .prepare("SELECT id FROM allocations WHERE applicantId = ? AND status != 'Cancelled'")
        .get(input.applicantId) as any;
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Applicant already has an active seat allocation',
        });
      }

      // Check quota availability
      const quota = db
        .prepare('SELECT * FROM quotas WHERE programId = ? AND quotaType = ?')
        .get(input.programId, input.quotaType) as any;
      if (!quota) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No ${input.quotaType} quota configured for this program`,
        });
      }

      const allocated = db
        .prepare(
          `SELECT COUNT(*) as count FROM allocations
           WHERE programId = ? AND quotaType = ? AND status != 'Cancelled'`
        )
        .get(input.programId, input.quotaType) as any;

      const totalAvailable = quota.seats + quota.supernumerarySeats;
      if (allocated.count >= totalAvailable) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `${input.quotaType} quota is full (${allocated.count}/${totalAvailable} seats allocated)`,
        });
      }

      // Allocate seat
      const result = db
        .prepare(
          `INSERT INTO allocations (applicantId, programId, quotaType, admissionMode, allotmentNumber, feeStatus, status)
           VALUES (?, ?, ?, ?, ?, 'Pending', 'Locked')`
        )
        .run(
          input.applicantId,
          input.programId,
          input.quotaType,
          input.admissionMode,
          input.allotmentNumber || ''
        );

      return {
        id: result.lastInsertRowid,
        remaining: totalAvailable - allocated.count - 1,
      };
    }),

  cancel: protectedProcedure
    .use(officerOrAdmin)
    .input(allocationSchema.pick({ applicantId: true }))
    .mutation(({ input }) => {
      const allocation = db
        .prepare("SELECT * FROM allocations WHERE applicantId = ? AND status = 'Locked'")
        .get(input.applicantId) as any;
      if (!allocation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No locked allocation found' });
      }
      db.prepare("UPDATE allocations SET status = 'Cancelled' WHERE id = ?").run(allocation.id);
      return { success: true };
    }),
});

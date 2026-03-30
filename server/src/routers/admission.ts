import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, roleGuard } from '../trpc';
import { feeUpdateSchema, confirmAdmissionSchema } from '../../../shared/schemas';
import db from '../db';

const officerOrAdmin = roleGuard('admin', 'officer');

export const admissionRouter = router({
  list: protectedProcedure.query(() => {
    return db
      .prepare(
        `SELECT al.*, a.fullName as applicantName, a.email as applicantEmail,
                p.name as programName, p.code as programCode,
                i.code as institutionCode, p.courseType
         FROM allocations al
         JOIN applicants a ON al.applicantId = a.id
         JOIN programs p ON al.programId = p.id
         JOIN departments d ON p.departmentId = d.id
         JOIN campuses c ON d.campusId = c.id
         JOIN institutions i ON c.institutionId = i.id
         WHERE al.status IN ('Locked', 'Confirmed')
         ORDER BY al.allocatedAt DESC`
      )
      .all();
  }),

  updateFee: protectedProcedure
    .use(officerOrAdmin)
    .input(feeUpdateSchema)
    .mutation(({ input }) => {
      const allocation = db
        .prepare("SELECT * FROM allocations WHERE id = ? AND status != 'Cancelled'")
        .get(input.allocationId) as any;
      if (!allocation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Allocation not found' });
      }
      if (allocation.status === 'Confirmed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change fee status after confirmation' });
      }
      db.prepare('UPDATE allocations SET feeStatus = ? WHERE id = ?').run(
        input.feeStatus,
        input.allocationId
      );
      return { success: true };
    }),

  confirm: protectedProcedure
    .use(officerOrAdmin)
    .input(confirmAdmissionSchema)
    .mutation(({ input }) => {
      const allocation = db
        .prepare(
          `SELECT al.*, p.code as programCode, p.courseType, i.code as institutionCode
           FROM allocations al
           JOIN programs p ON al.programId = p.id
           JOIN departments d ON p.departmentId = d.id
           JOIN campuses c ON d.campusId = c.id
           JOIN institutions i ON c.institutionId = i.id
           WHERE al.id = ?`
        )
        .get(input.allocationId) as any;

      if (!allocation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Allocation not found' });
      }
      if (allocation.status === 'Confirmed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already confirmed' });
      }
      if (allocation.status === 'Cancelled') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Allocation was cancelled' });
      }

      // Check fee paid
      if (allocation.feeStatus !== 'Paid') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Fee must be paid before confirmation',
        });
      }

      // Check all documents verified
      const pendingDocs = db
        .prepare(
          "SELECT COUNT(*) as count FROM documents WHERE applicantId = ? AND status != 'Verified'"
        )
        .get(allocation.applicantId) as any;

      if (pendingDocs.count > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `${pendingDocs.count} document(s) still not verified`,
        });
      }

      // Generate admission number: INST/YYYY/UG/CSE/KCET/0001
      const currentYear = db
        .prepare('SELECT year FROM academic_years WHERE isCurrent = 1')
        .get() as any;
      const yearStr = currentYear?.year?.split('-')[0] || new Date().getFullYear().toString();

      const existingCount = db
        .prepare(
          `SELECT COUNT(*) as count FROM allocations
           WHERE admissionNumber IS NOT NULL AND programId = ? AND quotaType = ?`
        )
        .get(allocation.programId, allocation.quotaType) as any;

      const serial = String(existingCount.count + 1).padStart(4, '0');
      const admissionNumber = `${allocation.institutionCode}/${yearStr}/${allocation.courseType}/${allocation.programCode}/${allocation.quotaType}/${serial}`;

      // Confirm
      db.prepare(
        "UPDATE allocations SET status = 'Confirmed', admissionNumber = ?, confirmedAt = datetime('now') WHERE id = ?"
      ).run(admissionNumber, input.allocationId);

      return { admissionNumber };
    }),
});

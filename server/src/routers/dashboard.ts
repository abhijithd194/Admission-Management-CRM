import { router, protectedProcedure } from '../trpc';
import db from '../db';

export const dashboardRouter = router({
  stats: protectedProcedure.query(() => {
    const totalIntake = db
      .prepare('SELECT COALESCE(SUM(totalIntake), 0) as total FROM programs')
      .get() as any;

    const totalAdmitted = db
      .prepare("SELECT COUNT(*) as count FROM allocations WHERE status = 'Confirmed'")
      .get() as any;

    const totalLocked = db
      .prepare("SELECT COUNT(*) as count FROM allocations WHERE status = 'Locked'")
      .get() as any;

    const pendingFees = db
      .prepare("SELECT COUNT(*) as count FROM allocations WHERE feeStatus = 'Pending' AND status = 'Locked'")
      .get() as any;

    const pendingDocs = db
      .prepare(
        `SELECT COUNT(DISTINCT a.id) as count FROM applicants a
         JOIN documents d ON a.id = d.applicantId
         JOIN allocations al ON a.id = al.applicantId AND al.status != 'Cancelled'
         WHERE d.status != 'Verified'`
      )
      .get() as any;

    return {
      totalIntake: totalIntake.total,
      totalAdmitted: totalAdmitted.count,
      totalLocked: totalLocked.count,
      remaining: totalIntake.total - totalAdmitted.count - totalLocked.count,
      pendingFees: pendingFees.count,
      pendingDocs: pendingDocs.count,
    };
  }),

  quotaSummary: protectedProcedure.query(() => {
    const programs = db.prepare('SELECT * FROM programs ORDER BY name').all() as any[];
    const result = programs.map((prog: any) => {
      const quotas = db
        .prepare('SELECT * FROM quotas WHERE programId = ?')
        .all(prog.id) as any[];

      const quotaDetails = quotas.map((q: any) => {
        const allocated = db
          .prepare(
            `SELECT COUNT(*) as count FROM allocations
             WHERE programId = ? AND quotaType = ? AND status != 'Cancelled'`
          )
          .get(prog.id, q.quotaType) as any;

        const confirmed = db
          .prepare(
            `SELECT COUNT(*) as count FROM allocations
             WHERE programId = ? AND quotaType = ? AND status = 'Confirmed'`
          )
          .get(prog.id, q.quotaType) as any;

        return {
          quotaType: q.quotaType,
          totalSeats: q.seats,
          allocated: allocated.count,
          confirmed: confirmed.count,
          remaining: q.seats - allocated.count,
        };
      });

      return {
        programId: prog.id,
        programName: prog.name,
        programCode: prog.code,
        courseType: prog.courseType,
        totalIntake: prog.totalIntake,
        quotas: quotaDetails,
      };
    });

    return result;
  }),

  pendingDocuments: protectedProcedure.query(() => {
    return db
      .prepare(
        `SELECT a.id, a.fullName, a.email, a.phone, p.name as programName,
                COUNT(CASE WHEN d.status = 'Pending' THEN 1 END) as pendingCount,
                COUNT(CASE WHEN d.status = 'Submitted' THEN 1 END) as submittedCount,
                COUNT(CASE WHEN d.status = 'Verified' THEN 1 END) as verifiedCount
         FROM applicants a
         JOIN programs p ON a.programId = p.id
         JOIN documents d ON a.id = d.applicantId
         JOIN allocations al ON a.id = al.applicantId AND al.status != 'Cancelled'
         GROUP BY a.id
         HAVING pendingCount > 0 OR submittedCount > 0
         ORDER BY pendingCount DESC`
      )
      .all();
  }),

  pendingFees: protectedProcedure.query(() => {
    return db
      .prepare(
        `SELECT al.id as allocationId, a.fullName, a.email, a.phone,
                p.name as programName, al.quotaType, al.allocatedAt
         FROM allocations al
         JOIN applicants a ON al.applicantId = a.id
         JOIN programs p ON al.programId = p.id
         WHERE al.feeStatus = 'Pending' AND al.status = 'Locked'
         ORDER BY al.allocatedAt ASC`
      )
      .all();
  }),
});

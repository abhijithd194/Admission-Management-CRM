import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, roleGuard } from '../trpc';
import { quotaConfigSchema } from '../../../shared/schemas';
import db from '../db';

const adminOnly = roleGuard('admin');

export const quotasRouter = router({
  getByProgram: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .query(({ input }) => {
      const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(input.programId) as any;
      if (!program) throw new TRPCError({ code: 'NOT_FOUND', message: 'Program not found' });

      const quotas = db.prepare('SELECT * FROM quotas WHERE programId = ?').all(input.programId) as any[];

      // Get allocated counts
      const allocCounts = db
        .prepare(
          `SELECT quotaType, COUNT(*) as allocated
           FROM allocations WHERE programId = ? AND status != 'Cancelled'
           GROUP BY quotaType`
        )
        .all(input.programId) as any[];

      const countMap: Record<string, number> = {};
      allocCounts.forEach((a: any) => {
        countMap[a.quotaType] = a.allocated;
      });

      return {
        program,
        quotas: quotas.map((q: any) => ({
          ...q,
          allocated: countMap[q.quotaType] || 0,
          remaining: q.seats - (countMap[q.quotaType] || 0),
        })),
        totalQuotaSeats: quotas.reduce((sum: number, q: any) => sum + q.seats, 0),
      };
    }),

  upsert: protectedProcedure
    .use(adminOnly)
    .input(quotaConfigSchema)
    .mutation(({ input }) => {
      const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(input.programId) as any;
      if (!program) throw new TRPCError({ code: 'NOT_FOUND', message: 'Program not found' });

      const totalSeats = input.quotas.reduce((sum, q) => sum + q.seats, 0);
      if (totalSeats !== program.totalIntake) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Total quota seats (${totalSeats}) must equal program intake (${program.totalIntake})`,
        });
      }

      const upsertStmt = db.prepare(
        `INSERT INTO quotas (programId, quotaType, seats, supernumerarySeats)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(programId, quotaType)
         DO UPDATE SET seats = excluded.seats, supernumerarySeats = excluded.supernumerarySeats`
      );

      const transaction = db.transaction(() => {
        for (const q of input.quotas) {
          upsertStmt.run(input.programId, q.quotaType, q.seats, input.supernumerarySeats);
        }
      });

      transaction();
      return { success: true };
    }),
});

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, roleGuard } from '../trpc';
import { applicantSchema, documentUpdateSchema, DOCUMENT_NAMES } from '../../../shared/schemas';
import db from '../db';

const officerOrAdmin = roleGuard('admin', 'officer');

export const applicantsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        programId: z.number().optional(),
        quotaType: z.string().optional(),
        category: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => {
      let query = `
        SELECT a.*, p.name as programName, p.code as programCode
        FROM applicants a
        JOIN programs p ON a.programId = p.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (input?.search) {
        query += ` AND (a.fullName LIKE ? OR a.email LIKE ? OR a.phone LIKE ?)`;
        const s = `%${input.search}%`;
        params.push(s, s, s);
      }
      if (input?.programId) {
        query += ` AND a.programId = ?`;
        params.push(input.programId);
      }
      if (input?.quotaType) {
        query += ` AND a.quotaType = ?`;
        params.push(input.quotaType);
      }
      if (input?.category) {
        query += ` AND a.category = ?`;
        params.push(input.category);
      }

      query += ` ORDER BY a.createdAt DESC`;
      return db.prepare(query).all(...params);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const applicant = db
        .prepare(
          `SELECT a.*, p.name as programName, p.code as programCode
           FROM applicants a JOIN programs p ON a.programId = p.id
           WHERE a.id = ?`
        )
        .get(input.id) as any;

      if (!applicant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Applicant not found' });

      const documents = db.prepare('SELECT * FROM documents WHERE applicantId = ?').all(input.id);

      const allocation = db.prepare('SELECT * FROM allocations WHERE applicantId = ?').get(input.id);

      return { ...applicant, documents, allocation };
    }),

  create: protectedProcedure
    .use(officerOrAdmin)
    .input(applicantSchema.omit({ id: true }))
    .mutation(({ input }) => {
      const result = db
        .prepare(
          `INSERT INTO applicants (fullName, dateOfBirth, gender, email, phone, category, programId, entryType, quotaType, qualifyingExam, marksOrRank, allotmentNumber, address, guardianName, guardianPhone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          input.fullName, input.dateOfBirth, input.gender, input.email, input.phone,
          input.category, input.programId, input.entryType, input.quotaType,
          input.qualifyingExam, input.marksOrRank, input.allotmentNumber || '',
          input.address || '', input.guardianName || '', input.guardianPhone || ''
        );

      const applicantId = result.lastInsertRowid as number;

      // Create document entries
      const docStmt = db.prepare(
        'INSERT INTO documents (applicantId, documentName, status) VALUES (?, ?, ?)'
      );
      for (const docName of DOCUMENT_NAMES) {
        docStmt.run(applicantId, docName, 'Pending');
      }

      return { id: applicantId, ...input };
    }),

  update: protectedProcedure
    .use(officerOrAdmin)
    .input(applicantSchema.required({ id: true }))
    .mutation(({ input }) => {
      db.prepare(
        `UPDATE applicants SET fullName=?, dateOfBirth=?, gender=?, email=?, phone=?, category=?, programId=?, entryType=?, quotaType=?, qualifyingExam=?, marksOrRank=?, allotmentNumber=?, address=?, guardianName=?, guardianPhone=? WHERE id=?`
      ).run(
        input.fullName, input.dateOfBirth, input.gender, input.email, input.phone,
        input.category, input.programId, input.entryType, input.quotaType,
        input.qualifyingExam, input.marksOrRank, input.allotmentNumber || '',
        input.address || '', input.guardianName || '', input.guardianPhone || '',
        input.id
      );
      return input;
    }),

  updateDocument: protectedProcedure
    .use(officerOrAdmin)
    .input(documentUpdateSchema)
    .mutation(({ input }) => {
      db.prepare(
        'UPDATE documents SET status = ? WHERE applicantId = ? AND documentName = ?'
      ).run(input.status, input.applicantId, input.documentName);
      return { success: true };
    }),
});

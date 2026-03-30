import { z } from 'zod';
import { router, protectedProcedure, roleGuard } from '../trpc';
import {
  institutionSchema,
  campusSchema,
  departmentSchema,
  programSchema,
  academicYearSchema,
} from '../../../shared/schemas';
import db from '../db';

const adminOnly = roleGuard('admin');

export const mastersRouter = router({
  // ─── Institutions ───
  listInstitutions: protectedProcedure.query(() => {
    return db.prepare('SELECT * FROM institutions ORDER BY name').all();
  }),

  createInstitution: protectedProcedure
    .use(adminOnly)
    .input(institutionSchema.omit({ id: true }))
    .mutation(({ input }) => {
      const stmt = db.prepare('INSERT INTO institutions (name, code) VALUES (?, ?)');
      const result = stmt.run(input.name, input.code);
      return { id: result.lastInsertRowid, ...input };
    }),

  updateInstitution: protectedProcedure
    .use(adminOnly)
    .input(institutionSchema.required({ id: true }))
    .mutation(({ input }) => {
      db.prepare('UPDATE institutions SET name = ?, code = ? WHERE id = ?').run(
        input.name,
        input.code,
        input.id
      );
      return input;
    }),

  deleteInstitution: protectedProcedure
    .use(adminOnly)
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.prepare('DELETE FROM institutions WHERE id = ?').run(input.id);
      return { success: true };
    }),

  // ─── Campuses ───
  listCampuses: protectedProcedure
    .input(z.object({ institutionId: z.number().optional() }).optional())
    .query(({ input }) => {
      if (input?.institutionId) {
        return db
          .prepare(
            `SELECT c.*, i.name as institutionName FROM campuses c
             JOIN institutions i ON c.institutionId = i.id
             WHERE c.institutionId = ? ORDER BY c.name`
          )
          .all(input.institutionId);
      }
      return db
        .prepare(
          `SELECT c.*, i.name as institutionName FROM campuses c
           JOIN institutions i ON c.institutionId = i.id ORDER BY c.name`
        )
        .all();
    }),

  createCampus: protectedProcedure
    .use(adminOnly)
    .input(campusSchema.omit({ id: true }))
    .mutation(({ input }) => {
      const result = db
        .prepare('INSERT INTO campuses (name, institutionId) VALUES (?, ?)')
        .run(input.name, input.institutionId);
      return { id: result.lastInsertRowid, ...input };
    }),

  updateCampus: protectedProcedure
    .use(adminOnly)
    .input(campusSchema.required({ id: true }))
    .mutation(({ input }) => {
      db.prepare('UPDATE campuses SET name = ?, institutionId = ? WHERE id = ?').run(
        input.name,
        input.institutionId,
        input.id
      );
      return input;
    }),

  deleteCampus: protectedProcedure
    .use(adminOnly)
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.prepare('DELETE FROM campuses WHERE id = ?').run(input.id);
      return { success: true };
    }),

  // ─── Departments ───
  listDepartments: protectedProcedure
    .input(z.object({ campusId: z.number().optional() }).optional())
    .query(({ input }) => {
      if (input?.campusId) {
        return db
          .prepare(
            `SELECT d.*, c.name as campusName FROM departments d
             JOIN campuses c ON d.campusId = c.id
             WHERE d.campusId = ? ORDER BY d.name`
          )
          .all(input.campusId);
      }
      return db
        .prepare(
          `SELECT d.*, c.name as campusName FROM departments d
           JOIN campuses c ON d.campusId = c.id ORDER BY d.name`
        )
        .all();
    }),

  createDepartment: protectedProcedure
    .use(adminOnly)
    .input(departmentSchema.omit({ id: true }))
    .mutation(({ input }) => {
      const result = db
        .prepare('INSERT INTO departments (name, campusId) VALUES (?, ?)')
        .run(input.name, input.campusId);
      return { id: result.lastInsertRowid, ...input };
    }),

  updateDepartment: protectedProcedure
    .use(adminOnly)
    .input(departmentSchema.required({ id: true }))
    .mutation(({ input }) => {
      db.prepare('UPDATE departments SET name = ?, campusId = ? WHERE id = ?').run(
        input.name,
        input.campusId,
        input.id
      );
      return input;
    }),

  deleteDepartment: protectedProcedure
    .use(adminOnly)
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.prepare('DELETE FROM departments WHERE id = ?').run(input.id);
      return { success: true };
    }),

  // ─── Programs ───
  listPrograms: protectedProcedure
    .input(z.object({ departmentId: z.number().optional() }).optional())
    .query(({ input }) => {
      if (input?.departmentId) {
        return db
          .prepare(
            `SELECT p.*, d.name as departmentName FROM programs p
             JOIN departments d ON p.departmentId = d.id
             WHERE p.departmentId = ? ORDER BY p.name`
          )
          .all(input.departmentId);
      }
      return db
        .prepare(
          `SELECT p.*, d.name as departmentName FROM programs p
           JOIN departments d ON p.departmentId = d.id ORDER BY p.name`
        )
        .all();
    }),

  createProgram: protectedProcedure
    .use(adminOnly)
    .input(programSchema.omit({ id: true }))
    .mutation(({ input }) => {
      const result = db
        .prepare(
          'INSERT INTO programs (name, code, departmentId, courseType, entryType, totalIntake) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(input.name, input.code, input.departmentId, input.courseType, input.entryType, input.totalIntake);
      return { id: result.lastInsertRowid, ...input };
    }),

  updateProgram: protectedProcedure
    .use(adminOnly)
    .input(programSchema.required({ id: true }))
    .mutation(({ input }) => {
      db.prepare(
        'UPDATE programs SET name = ?, code = ?, departmentId = ?, courseType = ?, entryType = ?, totalIntake = ? WHERE id = ?'
      ).run(input.name, input.code, input.departmentId, input.courseType, input.entryType, input.totalIntake, input.id);
      return input;
    }),

  deleteProgram: protectedProcedure
    .use(adminOnly)
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.prepare('DELETE FROM programs WHERE id = ?').run(input.id);
      return { success: true };
    }),

  // ─── Academic Years ───
  listAcademicYears: protectedProcedure.query(() => {
    return db.prepare('SELECT * FROM academic_years ORDER BY year DESC').all();
  }),

  createAcademicYear: protectedProcedure
    .use(adminOnly)
    .input(academicYearSchema.omit({ id: true }))
    .mutation(({ input }) => {
      if (input.isCurrent) {
        db.prepare('UPDATE academic_years SET isCurrent = 0').run();
      }
      const result = db
        .prepare('INSERT INTO academic_years (year, isCurrent) VALUES (?, ?)')
        .run(input.year, input.isCurrent ? 1 : 0);
      return { id: result.lastInsertRowid, ...input };
    }),

  updateAcademicYear: protectedProcedure
    .use(adminOnly)
    .input(academicYearSchema.required({ id: true }))
    .mutation(({ input }) => {
      if (input.isCurrent) {
        db.prepare('UPDATE academic_years SET isCurrent = 0').run();
      }
      db.prepare('UPDATE academic_years SET year = ?, isCurrent = ? WHERE id = ?').run(
        input.year,
        input.isCurrent ? 1 : 0,
        input.id
      );
      return input;
    }),

  deleteAcademicYear: protectedProcedure
    .use(adminOnly)
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.prepare('DELETE FROM academic_years WHERE id = ?').run(input.id);
      return { success: true };
    }),
});

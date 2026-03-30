import { z } from 'zod';

// ─── Enums ───
export const CourseType = z.enum(['UG', 'PG']);
export const EntryType = z.enum(['Regular', 'Lateral']);
export const AdmissionMode = z.enum(['Government', 'Management']);
export const Category = z.enum(['GM', 'SC', 'ST', 'OBC', 'Other']);
export const QuotaType = z.enum(['KCET', 'COMEDK', 'Management']);
export const DocumentStatus = z.enum(['Pending', 'Submitted', 'Verified']);
export const FeeStatus = z.enum(['Pending', 'Paid']);
export const AllocationStatus = z.enum(['Locked', 'Confirmed', 'Cancelled']);
export const Gender = z.enum(['Male', 'Female', 'Other']);
export const UserRole = z.enum(['admin', 'officer', 'management']);

// ─── Master Schemas ───
export const institutionSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Institution name is required'),
  code: z.string().min(1, 'Institution code is required').max(10),
});

export const campusSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Campus name is required'),
  institutionId: z.number(),
});

export const departmentSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Department name is required'),
  campusId: z.number(),
});

export const programSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Program name is required'),
  code: z.string().min(1, 'Program code is required').max(10),
  departmentId: z.number(),
  courseType: CourseType,
  entryType: EntryType,
  totalIntake: z.number().int().min(1, 'Intake must be at least 1'),
});

export const academicYearSchema = z.object({
  id: z.number().optional(),
  year: z.string().min(1, 'Academic year is required'), // e.g., "2026-27"
  isCurrent: z.boolean().default(false),
});

// ─── Quota Schema ───
export const quotaItemSchema = z.object({
  quotaType: QuotaType,
  seats: z.number().int().min(0),
});

export const quotaConfigSchema = z.object({
  programId: z.number(),
  quotas: z.array(quotaItemSchema),
  supernumerarySeats: z.number().int().min(0).default(0),
});

// ─── Applicant Schema ───
export const applicantSchema = z.object({
  id: z.number().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: Gender,
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  category: Category,
  programId: z.number(),
  entryType: EntryType,
  quotaType: QuotaType,
  qualifyingExam: z.string().min(1, 'Qualifying exam is required'),
  marksOrRank: z.string().min(1, 'Marks/Rank is required'),
  allotmentNumber: z.string().optional().default(''),
  address: z.string().optional().default(''),
  guardianName: z.string().optional().default(''),
  guardianPhone: z.string().optional().default(''),
});

export const documentUpdateSchema = z.object({
  applicantId: z.number(),
  documentName: z.string(),
  status: DocumentStatus,
});

// ─── Allocation Schema ───
export const allocationSchema = z.object({
  applicantId: z.number(),
  programId: z.number(),
  quotaType: QuotaType,
  admissionMode: AdmissionMode,
  allotmentNumber: z.string().optional(),
});

// ─── Fee Update Schema ───
export const feeUpdateSchema = z.object({
  allocationId: z.number(),
  feeStatus: FeeStatus,
});

// ─── Confirm Admission Schema ───
export const confirmAdmissionSchema = z.object({
  allocationId: z.number(),
});

// ─── Login Schema ───
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ─── Inferred Types ───
export type Institution = z.infer<typeof institutionSchema>;
export type Campus = z.infer<typeof campusSchema>;
export type Department = z.infer<typeof departmentSchema>;
export type Program = z.infer<typeof programSchema>;
export type AcademicYear = z.infer<typeof academicYearSchema>;
export type QuotaItem = z.infer<typeof quotaItemSchema>;
export type QuotaConfig = z.infer<typeof quotaConfigSchema>;
export type Applicant = z.infer<typeof applicantSchema>;
export type Allocation = z.infer<typeof allocationSchema>;
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>;
export type UserRoleType = z.infer<typeof UserRole>;

export const DOCUMENT_NAMES = [
  '10th Marks Card',
  '12th Marks Card',
  'Transfer Certificate',
  'Category Certificate',
  'Allotment Letter',
  'Passport Photo',
  'ID Proof',
] as const;

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'admission.db');

const db: Database.Database = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS campuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      institutionId INTEGER NOT NULL,
      FOREIGN KEY (institutionId) REFERENCES institutions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      campusId INTEGER NOT NULL,
      FOREIGN KEY (campusId) REFERENCES campuses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      departmentId INTEGER NOT NULL,
      courseType TEXT NOT NULL CHECK(courseType IN ('UG','PG')),
      entryType TEXT NOT NULL CHECK(entryType IN ('Regular','Lateral')),
      totalIntake INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year TEXT NOT NULL UNIQUE,
      isCurrent INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programId INTEGER NOT NULL,
      quotaType TEXT NOT NULL CHECK(quotaType IN ('KCET','COMEDK','Management')),
      seats INTEGER NOT NULL DEFAULT 0,
      supernumerarySeats INTEGER NOT NULL DEFAULT 0,
      UNIQUE(programId, quotaType),
      FOREIGN KEY (programId) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applicants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      dateOfBirth TEXT NOT NULL,
      gender TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT NOT NULL,
      programId INTEGER NOT NULL,
      entryType TEXT NOT NULL,
      quotaType TEXT NOT NULL,
      qualifyingExam TEXT NOT NULL,
      marksOrRank TEXT NOT NULL,
      allotmentNumber TEXT DEFAULT '',
      address TEXT DEFAULT '',
      guardianName TEXT DEFAULT '',
      guardianPhone TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (programId) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicantId INTEGER NOT NULL,
      documentName TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Submitted','Verified')),
      UNIQUE(applicantId, documentName),
      FOREIGN KEY (applicantId) REFERENCES applicants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicantId INTEGER NOT NULL UNIQUE,
      programId INTEGER NOT NULL,
      quotaType TEXT NOT NULL,
      admissionMode TEXT NOT NULL,
      allotmentNumber TEXT DEFAULT '',
      feeStatus TEXT NOT NULL DEFAULT 'Pending' CHECK(feeStatus IN ('Pending','Paid')),
      status TEXT NOT NULL DEFAULT 'Locked' CHECK(status IN ('Locked','Confirmed','Cancelled')),
      admissionNumber TEXT UNIQUE,
      allocatedAt TEXT DEFAULT (datetime('now')),
      confirmedAt TEXT,
      FOREIGN KEY (applicantId) REFERENCES applicants(id) ON DELETE CASCADE,
      FOREIGN KEY (programId) REFERENCES programs(id) ON DELETE CASCADE
    );
  `);

  // Seed default data if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM institutions').get() as { c: number };
  if (count.c === 0) {
    seedData();
  }
}

function seedData() {
  const instStmt = db.prepare('INSERT INTO institutions (name, code) VALUES (?, ?)');
  const inst = instStmt.run('Demo Engineering College', 'DEC');

  const campusStmt = db.prepare('INSERT INTO campuses (name, institutionId) VALUES (?, ?)');
  const campus = campusStmt.run('Main Campus', inst.lastInsertRowid);

  const deptStmt = db.prepare('INSERT INTO departments (name, campusId) VALUES (?, ?)');
  const csDept = deptStmt.run('Computer Science', campus.lastInsertRowid);
  const ecDept = deptStmt.run('Electronics', campus.lastInsertRowid);

  const progStmt = db.prepare('INSERT INTO programs (name, code, departmentId, courseType, entryType, totalIntake) VALUES (?, ?, ?, ?, ?, ?)');
  const cse = progStmt.run('Computer Science & Engineering', 'CSE', csDept.lastInsertRowid, 'UG', 'Regular', 120);
  const ece = progStmt.run('Electronics & Communication', 'ECE', ecDept.lastInsertRowid, 'UG', 'Regular', 60);

  const quotaStmt = db.prepare('INSERT INTO quotas (programId, quotaType, seats) VALUES (?, ?, ?)');
  quotaStmt.run(cse.lastInsertRowid, 'KCET', 50);
  quotaStmt.run(cse.lastInsertRowid, 'COMEDK', 40);
  quotaStmt.run(cse.lastInsertRowid, 'Management', 30);
  quotaStmt.run(ece.lastInsertRowid, 'KCET', 25);
  quotaStmt.run(ece.lastInsertRowid, 'COMEDK', 20);
  quotaStmt.run(ece.lastInsertRowid, 'Management', 15);

  const yearStmt = db.prepare('INSERT INTO academic_years (year, isCurrent) VALUES (?, ?)');
  yearStmt.run('2026-27', 1);
}

export default db;

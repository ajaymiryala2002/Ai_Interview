-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'General',
    "image_url" TEXT,
    "access_granted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Candidate_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "Organizer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Candidate" ("access_granted", "createdAt", "email", "id", "name", "organizer_id", "phone", "updatedAt") SELECT "access_granted", "createdAt", "email", "id", "name", "organizer_id", "phone", "updatedAt" FROM "Candidate";
DROP TABLE "Candidate";
ALTER TABLE "new_Candidate" RENAME TO "Candidate";
CREATE TABLE "new_InterviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidate_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "started_at" DATETIME,
    "ended_at" DATETIME,
    "overall_score" REAL,
    "result" TEXT,
    "rejection_reason" TEXT,
    "rejection_proofs" TEXT,
    "face_verified" BOOLEAN NOT NULL DEFAULT false,
    "face_match_score" REAL,
    "result_email_sent_at" DATETIME,
    "recording_url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewSession_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InterviewSession" ("candidate_id", "createdAt", "ended_at", "id", "overall_score", "recording_url", "result_email_sent_at", "started_at", "status", "updatedAt") SELECT "candidate_id", "createdAt", "ended_at", "id", "overall_score", "recording_url", "result_email_sent_at", "started_at", "status", "updatedAt" FROM "InterviewSession";
DROP TABLE "InterviewSession";
ALTER TABLE "new_InterviewSession" RENAME TO "InterviewSession";
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'General',
    "difficulty" TEXT NOT NULL,
    "rubric" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Question" ("createdAt", "difficulty", "id", "rubric", "text", "topic", "updatedAt") SELECT "createdAt", "difficulty", "id", "rubric", "text", "topic", "updatedAt" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

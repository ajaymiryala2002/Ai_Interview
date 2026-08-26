-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "total_answered" INTEGER NOT NULL DEFAULT 0,
    "cheating_detected" BOOLEAN NOT NULL DEFAULT false,
    "cheating_reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewSession_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InterviewSession" ("candidate_id", "createdAt", "ended_at", "face_match_score", "face_verified", "id", "overall_score", "recording_url", "rejection_proofs", "rejection_reason", "result", "result_email_sent_at", "started_at", "status", "updatedAt") SELECT "candidate_id", "createdAt", "ended_at", "face_match_score", "face_verified", "id", "overall_score", "recording_url", "rejection_proofs", "rejection_reason", "result", "result_email_sent_at", "started_at", "status", "updatedAt" FROM "InterviewSession";
DROP TABLE "InterviewSession";
ALTER TABLE "new_InterviewSession" RENAME TO "InterviewSession";
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'General',
    "difficulty" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'theoretical',
    "rubric" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Question" ("createdAt", "difficulty", "id", "role", "rubric", "text", "topic", "updatedAt") SELECT "createdAt", "difficulty", "id", "role", "rubric", "text", "topic", "updatedAt" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

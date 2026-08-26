const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.interviewSession.findMany({
    include: {
      candidate: true,
      proctorEvents: true,
      answers: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Found ${sessions.length} sessions:`);
  for (const s of sessions) {
    console.log(`\nSession ID: ${s.id}`);
    console.log(`Candidate: ${s.candidate?.name} (${s.candidate?.email})`);
    console.log(`Status: ${s.status}, Result: ${s.result}`);
    console.log(`Overall Score: ${s.overall_score}%, Correct count: ${s.correct_count}`);
    console.log(`Face Verified: ${s.face_verified}, Face Match Score: ${s.face_match_score}`);
    console.log(`Cheating Detected: ${s.cheating_detected}, Reason: ${s.cheating_reason}`);
    console.log(`Proctoring Flags: ${s.proctorEvents.length} events`);
    for (const event of s.proctorEvents) {
      console.log(`  - ${event.event_type} at ${event.timestamp_in_session}s`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);

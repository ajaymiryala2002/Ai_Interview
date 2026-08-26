const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  // 1. Create organizer if none exists
  let organizer = await prisma.organizer.findFirst();
  if (!organizer) {
    organizer = await prisma.organizer.create({
      data: {
        name: 'Test Organizer',
        email: 'test@pyproctor.com',
        password_hash: '$2b$10$hashedpasswordplaceholder',
        org_name: 'PyProctor Test'
      }
    });
    console.log('Created organizer:', organizer.id);
  } else {
    console.log('Found organizer:', organizer.id);
  }

  // 2. Create test candidate
  const candidate = await prisma.candidate.create({
    data: {
      organizer_id: organizer.id,
      name: 'Ajay Test Candidate',
      email: 'candidate@test.com',
      phone: '9999999999',
      access_granted: true
    }
  });
  console.log('Created candidate:', candidate.id);

  // 3. Create invite token (expires in 7 days)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.inviteToken.create({
    data: {
      candidate_id: candidate.id,
      token: token,
      status: 'pending',
      expires_at: expiresAt
    }
  });
  console.log('Created invite token:', invite.token);
  console.log('Expires:', invite.expires_at);

  // 4. Create a sample question (needed for interview session)
  const question = await prisma.question.create({
    data: {
      text: 'What is the difference between a list and a tuple in Python?',
      topic: 'Python Basics',
      difficulty: 'easy',
      rubric: 'Mentions mutability, syntax differences, and use cases.'
    }
  });
  console.log('Created question:', question.id);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

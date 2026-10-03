import 'dotenv/config';
import app from './app';
import prisma from './config/db';
import { execSync } from 'child_process';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    const qCount = await prisma.question.count();
    if (qCount === 0) {
      console.log('No questions found in database. Seeding 48 questions before starting server...');
      execSync('node prisma/seed.js', { cwd: process.cwd(), stdio: 'inherit' });
      console.log('Database seeded successfully.');
    } else {
      console.log(`Database already has ${qCount} questions.`);
    }
  } catch (err) {
    console.error('Failed to seed database. Fix the error above and restart the server.', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();

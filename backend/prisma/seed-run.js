const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pythonQuestions = [
    { text: 'What is the difference between a list and a tuple in Python?', topic: 'Data Structures', role: 'Python', difficulty: 'Easy', rubric: 'List is mutable, tuple is immutable. Lists use [], tuples use (). Tuples are generally faster and use less memory.' },
    { text: 'Explain how a decorator works in Python.', topic: 'Functions', role: 'Python', difficulty: 'Medium', rubric: 'A decorator is a function that takes another function as an argument and extends its behavior without explicitly modifying it. It uses the @ symbol.' },
    { text: 'What does the `yield` keyword do in Python?', topic: 'Generators', role: 'Python', difficulty: 'Medium', rubric: 'Yield pauses the function saving all its states and later continues from there on successive calls. It is used to create a generator instead of returning a single value.' },
    { text: 'Explain Python GIL and its impact on multi-threading.', topic: 'Concurrency', role: 'Python', difficulty: 'Hard', rubric: 'GIL (Global Interpreter Lock) allows only one thread to execute Python bytecode at a time. It prevents true parallel execution of threads for CPU-bound tasks but I/O-bound tasks can still benefit.' }
  ];

  const javaQuestions = [
    { text: 'What is the difference between `==` and `.equals()` in Java?', topic: 'Basics', role: 'Java', difficulty: 'Easy', rubric: '`==` checks reference equality for objects and value equality for primitives. `.equals()` checks logical/content equality and should be overridden for custom classes.' },
    { text: 'Explain the difference between ArrayList and LinkedList.', topic: 'Collections', role: 'Java', difficulty: 'Medium', rubric: 'ArrayList uses a dynamic array - fast random access, slow insertions/deletions in the middle. LinkedList uses doubly-linked nodes - fast insertions/deletions, slow random access.' },
    { text: 'What is the Spring Framework and what are its core features?', topic: 'Frameworks', role: 'Java', difficulty: 'Medium', rubric: 'Spring is a Java framework for building enterprise applications. Core features: Dependency Injection, AOP, MVC, Spring Boot for auto-configuration, Spring Data for database access.' },
    { text: 'Explain Java memory model and garbage collection.', topic: 'JVM', role: 'Java', difficulty: 'Hard', rubric: 'Java Memory Model defines how threads interact through memory. Heap is divided into Eden, Survivor, Old generations. GC algorithms: Serial, Parallel, CMS, G1, ZGC.' }
  ];

  const dsQuestions = [
    { text: 'What is the difference between supervised and unsupervised learning?', topic: 'Machine Learning', role: 'Data Science', difficulty: 'Easy', rubric: 'Supervised learning uses labeled data to train models (classification, regression). Unsupervised learning finds patterns in unlabeled data (clustering, dimensionality reduction).' },
    { text: 'Explain bias-variance tradeoff.', topic: 'Machine Learning', role: 'Data Science', difficulty: 'Medium', rubric: 'Bias is error from oversimplified assumptions. Variance is error from sensitivity to small fluctuations. High bias causes underfitting, high variance causes overfitting. Goal is optimal balance.' },
    { text: 'What is the difference between precision and recall?', topic: 'Metrics', role: 'Data Science', difficulty: 'Medium', rubric: 'Precision = TP / (TP + FP) - of all predicted positives, how many are actual. Recall = TP / (TP + FN) - of all actual positives, how many were found. F1-score balances both.' },
    { text: 'Explain gradient descent and its variants.', topic: 'Optimization', role: 'Data Science', difficulty: 'Hard', rubric: 'Gradient descent iteratively updates weights in the direction of negative gradient. Variants: Batch GD (full dataset), SGD (single sample), Mini-batch GD (subset), Momentum, Adam, RMSprop.' }
  ];

  const generalQuestions = [
    { text: 'Tell me about yourself and your technical background.', topic: 'Introduction', role: 'General', difficulty: 'Easy', rubric: 'Candidate should provide a concise overview of education, work experience, key skills, and relevant projects. Should be well-structured and professional.' },
    { text: 'Describe a challenging technical problem you solved recently.', topic: 'Problem Solving', role: 'General', difficulty: 'Medium', rubric: 'Candidate should describe the problem clearly, explain their approach, mention tools/technologies used, and highlight the outcome or lessons learned.' }
  ];

  const allQuestions = [...pythonQuestions, ...javaQuestions, ...dsQuestions, ...generalQuestions];

  for (const q of allQuestions) {
    const existing = await prisma.question.findFirst({ where: { text: q.text } });
    if (!existing) {
      await prisma.question.create({ data: q });
      console.log(`Added: ${q.role} - ${q.text.substring(0, 50)}...`);
    } else {
      await prisma.question.update({ where: { id: existing.id }, data: { role: q.role } });
      console.log(`Updated role: ${q.role} - ${q.text.substring(0, 50)}...`);
    }
  }

  console.log(`Database seeded/updated with ${allQuestions.length} role-specific questions!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

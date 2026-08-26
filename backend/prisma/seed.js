"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Python questions - Basic (Easy) + Medium, mixed theoretical and problem_solving
    await prisma.question.createMany({
        data: [
            {
                text: 'What is the difference between a list and a tuple in Python?',
                topic: 'Data Structures',
                role: 'Python',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'List is mutable, tuple is immutable. Lists use [], tuples use (). Tuples are generally faster and use less memory.'
            },
            {
                text: 'Explain how a decorator works in Python.',
                topic: 'Functions',
                role: 'Python',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'A decorator is a function that takes another function as an argument and extends its behavior without explicitly modifying it. It uses the @ symbol.'
            },
            {
                text: 'What does the `yield` keyword do in Python?',
                topic: 'Generators',
                role: 'Python',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Yield pauses the function saving all its states and later continues from there on successive calls. It is used to create a generator instead of returning a single value.'
            },
            {
                text: 'Write a Python function to reverse a string without using slicing.',
                topic: 'Strings',
                role: 'Python',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Should use a loop or reversed() with join. Must not use [::-1] slicing. Time complexity O(n), space O(n).'
            },
            {
                text: 'Write a Python function to check if a number is prime.',
                topic: 'Math',
                role: 'Python',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Should handle edge cases (n < 2). Check divisibility up to sqrt(n). Return boolean. Time complexity O(sqrt(n)).'
            },
            {
                text: 'Explain list comprehension and give an example to filter even numbers.',
                topic: 'Data Structures',
                role: 'Python',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'List comprehension is a concise way to create lists. Syntax: [x for x in iterable if condition]. Example: [x for x in range(10) if x % 2 == 0].'
            },
            {
                text: 'What are *args and **kwargs in Python functions?',
                topic: 'Functions',
                role: 'Python',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: '*args collects positional arguments into a tuple. **kwargs collects keyword arguments into a dictionary. Allows flexible function signatures.'
            },
            {
                text: 'Write a Python function to find the second largest number in a list.',
                topic: 'Data Structures',
                role: 'Python',
                difficulty: 'Medium',
                type: 'problem_solving',
                rubric: 'Should handle duplicates and empty lists. Can sort and pick second unique, or track max and second_max in one pass. Time O(n) preferred.'
            },
            {
                text: 'Explain the difference between `is` and `==` in Python.',
                topic: 'Basics',
                role: 'Python',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: '`==` checks value equality. `is` checks identity (same memory address). For strings and small integers, Python may intern them.'
            },
            {
                text: 'Write a Python function to count the frequency of each character in a string.',
                topic: 'Strings',
                role: 'Python',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Use a dictionary or collections.Counter. Return a dict with character counts. Handle empty string. Time O(n), space O(k) where k is unique chars.'
            },
            {
                text: 'What is a Python dictionary and how does it handle collisions?',
                topic: 'Data Structures',
                role: 'Python',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Dictionary is a hash map. Python 3.6+ preserves insertion order. Collisions handled via open addressing with probing. Average O(1) lookup.'
            },
            {
                text: 'Write a Python function to merge two sorted lists into one sorted list.',
                topic: 'Algorithms',
                role: 'Python',
                difficulty: 'Medium',
                type: 'problem_solving',
                rubric: 'Use two-pointer technique. Time O(n+m), space O(n+m). Should not use sort() on concatenated list for optimal solution.'
            }
        ]
    });
    // Java questions - Basic (Easy) + Medium, mixed theoretical and problem_solving
    await prisma.question.createMany({
        data: [
            {
                text: 'What is the difference between `==` and `.equals()` in Java?',
                topic: 'Basics',
                role: 'Java',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: '`==` checks reference equality for objects and value equality for primitives. `.equals()` checks logical/content equality and should be overridden for custom classes.'
            },
            {
                text: 'Explain the difference between ArrayList and LinkedList.',
                topic: 'Collections',
                role: 'Java',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'ArrayList uses a dynamic array - fast random access, slow insertions/deletions in the middle. LinkedList uses doubly-linked nodes - fast insertions/deletions, slow random access.'
            },
            {
                text: 'What is the Spring Framework and what are its core features?',
                topic: 'Frameworks',
                role: 'Java',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Spring is a Java framework for building enterprise applications. Core features: Dependency Injection, AOP, MVC, Spring Boot for auto-configuration, Spring Data for database access.'
            },
            {
                text: 'Write a Java method to check if a string is a palindrome.',
                topic: 'Strings',
                role: 'Java',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Ignore case and non-alphanumeric characters. Use two pointers from start and end. Time O(n), space O(1) extra.'
            },
            {
                text: 'Write a Java program to find the factorial of a number using recursion.',
                topic: 'Math',
                role: 'Java',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Base case: n <= 1 return 1. Recursive case: n * factorial(n-1). Handle negative input. Time O(n), space O(n) for call stack.'
            },
            {
                text: 'Explain the difference between `final`, `finally`, and `finalize` in Java.',
                topic: 'Basics',
                role: 'Java',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: '`final` is a keyword for constants/classes/methods. `finally` is a block that always executes after try-catch. `finalize()` is a method called by GC before object destruction.'
            },
            {
                text: 'Write a Java method to find the maximum element in an integer array.',
                topic: 'Arrays',
                role: 'Java',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Iterate once, track max. Handle empty array edge case. Time O(n), space O(1).'
            },
            {
                text: 'What is method overloading vs method overriding in Java?',
                topic: 'OOP',
                role: 'Java',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Overloading: same method name, different parameters, same class. Overriding: same signature, different implementation, subclass. Overriding requires inheritance.'
            },
            {
                text: 'Write a Java program to reverse an array in-place.',
                topic: 'Arrays',
                role: 'Java',
                difficulty: 'Medium',
                type: 'problem_solving',
                rubric: 'Use two pointers, swap elements. Time O(n/2) = O(n), space O(1). Must modify original array without extra array.'
            },
            {
                text: 'Explain Java interfaces vs abstract classes.',
                topic: 'OOP',
                role: 'Java',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Interface: all methods abstract (pre-Java 8), multiple inheritance supported. Abstract class: can have concrete methods, instance variables, only single inheritance. Use interface for contracts, abstract class for shared code.'
            },
            {
                text: 'Write a Java method to check if two strings are anagrams.',
                topic: 'Strings',
                role: 'Java',
                difficulty: 'Medium',
                type: 'problem_solving',
                rubric: 'Sort both strings and compare, or use character frequency map. Time O(n log n) or O(n), space O(n).'
            },
            {
                text: 'What is the difference between String, StringBuilder, and StringBuffer?',
                topic: 'Strings',
                role: 'Java',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'String is immutable. StringBuilder is mutable and not thread-safe (faster). StringBuffer is mutable and thread-safe (slower due to synchronization).'
            }
        ]
    });
    // Data Science questions - Basic (Easy) + Medium, mixed theoretical and problem_solving
    await prisma.question.createMany({
        data: [
            {
                text: 'What is the difference between supervised and unsupervised learning?',
                topic: 'Machine Learning',
                role: 'Data Science',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Supervised learning uses labeled data to train models (classification, regression). Unsupervised learning finds patterns in unlabeled data (clustering, dimensionality reduction).'
            },
            {
                text: 'Explain bias-variance tradeoff.',
                topic: 'Machine Learning',
                role: 'Data Science',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Bias is error from oversimplified assumptions. Variance is error from sensitivity to small fluctuations. High bias causes underfitting, high variance causes overfitting. Goal is optimal balance.'
            },
            {
                text: 'What is the difference between precision and recall?',
                topic: 'Metrics',
                role: 'Data Science',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Precision = TP / (TP + FP) - of all predicted positives, how many are actual. Recall = TP / (TP + FN) - of all actual positives, how many were found. F1-score balances both.'
            },
            {
                text: 'Given a dataset with missing values, what are three strategies to handle them?',
                topic: 'Data Preprocessing',
                role: 'Data Science',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: '1) Remove rows/columns with missing values. 2) Impute with mean/median/mode. 3) Use predictive models to fill missing values. 4) Forward/backward fill for time series.'
            },
            {
                text: 'Write pseudocode or Python code to calculate the mean and standard deviation of a list of numbers.',
                topic: 'Statistics',
                role: 'Data Science',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Mean: sum(x)/n. Std dev: sqrt(sum((x-mean)^2)/n) or /(n-1) for sample. Handle empty list. Time O(n), space O(1).'
            },
            {
                text: 'What is the difference between classification and regression?',
                topic: 'Machine Learning',
                role: 'Data Science',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Classification predicts discrete categories/labels. Regression predicts continuous numerical values. Examples: spam detection (classification), house price prediction (regression).'
            },
            {
                text: 'Explain what a confusion matrix is and its components.',
                topic: 'Metrics',
                role: 'Data Science',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Table showing TP, FP, TN, FN. TP: correctly predicted positive. FP: falsely predicted positive. TN: correctly predicted negative. FN: falsely predicted negative.'
            },
            {
                text: 'You have a dataset with 1000 rows and 50 features. How would you reduce dimensionality?',
                topic: 'Dimensionality Reduction',
                role: 'Data Science',
                difficulty: 'Medium',
                type: 'problem_solving',
                rubric: 'Mention PCA, feature selection (correlation, mutual information), regularization (L1/Lasso), or domain knowledge. PCA finds orthogonal components with max variance.'
            },
            {
                text: 'What is cross-validation and why is it important?',
                topic: 'Model Evaluation',
                role: 'Data Science',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Technique to assess model generalization by splitting data into k folds. Train on k-1 folds, validate on remaining. Reduces overfitting risk compared to single train-test split.'
            },
            {
                text: 'Write Python code to normalize a list of numbers to range [0, 1].',
                topic: 'Data Preprocessing',
                role: 'Data Science',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Formula: (x - min) / (max - min). Handle case where max == min (all same values). Time O(n), space O(n) for output.'
            },
            {
                text: 'Explain overfitting and list two ways to prevent it.',
                topic: 'Machine Learning',
                role: 'Data Science',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Overfitting: model learns training data too well, performs poorly on new data. Prevention: regularization, more training data, cross-validation, simpler model, dropout, early stopping.'
            },
            {
                text: 'Given two arrays of equal length, write Python code to compute their Pearson correlation coefficient.',
                topic: 'Statistics',
                role: 'Data Science',
                difficulty: 'Medium',
                type: 'problem_solving',
                rubric: 'Formula: cov(X,Y) / (std(X) * std(Y)). Can use numpy.corrcoef or manual calculation. Handle zero standard deviation. Time O(n), space O(1).'
            }
        ]
    });
    // General questions - mixed theoretical and problem_solving
    await prisma.question.createMany({
        data: [
            {
                text: 'Tell me about yourself and your technical background.',
                topic: 'Introduction',
                role: 'General',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Candidate should provide a concise overview of education, work experience, key skills, and relevant projects. Should be well-structured and professional.'
            },
            {
                text: 'Describe a challenging technical problem you solved recently.',
                topic: 'Problem Solving',
                role: 'General',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Candidate should describe the problem clearly, explain their approach, mention tools/technologies used, and highlight the outcome or lessons learned.'
            },
            {
                text: 'Explain the difference between REST and SOAP APIs.',
                topic: 'Web Services',
                role: 'General',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'REST is architectural style using HTTP methods, lightweight, JSON/XML. SOAP is protocol, XML-based, strict standards, WS-* specifications, more overhead.'
            },
            {
                text: 'What is the time complexity of binary search and when can you use it?',
                topic: 'Algorithms',
                role: 'General',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'O(log n). Requires sorted array or searchable sorted structure. Compares target with middle element, halves search space each iteration.'
            },
            {
                text: 'Explain Git branching strategy you would use for a team project.',
                topic: 'Version Control',
                role: 'General',
                difficulty: 'Medium',
                type: 'theoretical',
                rubric: 'Mention GitFlow (main, develop, feature, release, hotfix branches) or trunk-based development. Explain merge/pull requests, code reviews, CI/CD integration.'
            },
            {
                text: 'Write pseudocode to find the first duplicate element in an array.',
                topic: 'Algorithms',
                role: 'General',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Use a hash set. Iterate array, if element in set return it, else add to set. Time O(n), space O(n). Return -1 or null if no duplicates.'
            },
            {
                text: 'What are ACID properties in database transactions?',
                topic: 'Databases',
                role: 'General',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Atomicity: all or nothing. Consistency: valid state transitions. Isolation: concurrent transactions don\'t interfere. Durability: committed data survives failures.'
            },
            {
                text: 'Explain the difference between SQL and NoSQL databases with examples.',
                topic: 'Databases',
                role: 'General',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'SQL: structured schema, relational, ACID compliant (PostgreSQL, MySQL). NoSQL: flexible schema, horizontal scaling, eventual consistency (MongoDB, Redis, Cassandra).'
            },
            {
                text: 'Write pseudocode for the Bubble Sort algorithm.',
                topic: 'Algorithms',
                role: 'General',
                difficulty: 'Easy',
                type: 'problem_solving',
                rubric: 'Nested loops, compare adjacent elements, swap if out of order. Outer loop n-1 times, inner loop n-i-1 times. Time O(n^2), space O(1).'
            },
            {
                text: 'What is the difference between unit testing and integration testing?',
                topic: 'Testing',
                role: 'General',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Unit testing: test individual components in isolation (mocks/stubs). Integration testing: test how components work together. Unit tests are faster, integration tests verify real interactions.'
            },
            {
                text: 'Explain how you would debug a production issue that you cannot reproduce locally.',
                topic: 'Debugging',
                role: 'General',
                difficulty: 'Medium',
                type: 'problem_solving',
                rubric: 'Check logs, monitoring dashboards, error tracking. Use feature flags to isolate. Add temporary instrumentation. Compare environments. Check data differences. Use remote debugging if possible.'
            },
            {
                text: 'What is the difference between synchronous and asynchronous programming?',
                topic: 'Concurrency',
                role: 'General',
                difficulty: 'Easy',
                type: 'theoretical',
                rubric: 'Synchronous: tasks execute sequentially, blocking. Asynchronous: tasks can run concurrently, non-blocking, uses callbacks/promises/async-await. Better for I/O-bound operations.'
            }
        ]
    });
    console.log('Database seeded with 48 role-specific questions (Easy + Medium, theoretical + problem_solving)!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
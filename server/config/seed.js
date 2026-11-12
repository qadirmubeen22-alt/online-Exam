const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

const seedInitialData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('📦 Database already seeded with users.');
      return;
    }

    console.log('🌱 Seeding default demo accounts and exam questions...');
    const salt = await bcrypt.genSalt(10);
    const teacherPasswordHash = await bcrypt.hash('teacher123', salt);
    const studentPasswordHash = await bcrypt.hash('student123', salt);

    const teacher = await User.create({
      name: 'Prof. Alan Turing',
      email: 'teacher@exam.com',
      passwordHash: teacherPasswordHash,
      role: 'teacher',
    });

    const student = await User.create({
      name: 'Ada Lovelace',
      email: 'student@exam.com',
      passwordHash: studentPasswordHash,
      role: 'student',
    });

    console.log(`👤 Created Teacher: teacher@exam.com / teacher123`);
    console.log(`👤 Created Student: student@exam.com / student123`);

    // Create Demo Exam
    const exam = await Exam.create({
      title: 'Full-Stack Web Development Final Exam',
      description: 'Comprehensive evaluation covering modern JavaScript ES6+, Browser Security, DOM Events, and Coding Algorithms.',
      createdBy: String(teacher._id),
      durationMinutes: 15,
      passingScore: 60,
      examCode: 'DEV101',
      maxWarnings: 3,
      isActive: true,
    });

    const examId = String(exam._id);

    // Add MCQs
    await Question.create({
      examId,
      type: 'mcq',
      questionText: 'Which event is triggered in the browser when a student navigates away from the exam tab to another tab or application?',
      options: [
        'document.onbeforeunload',
        'document.visibilitychange',
        'window.onresize',
        'navigator.online'
      ],
      correctOptionIndex: 1,
      marks: 3,
    });

    await Question.create({
      examId,
      type: 'mcq',
      questionText: 'In React, which Hook is best suited for setting up browser event listeners like window.onblur and cleaning them up on unmount?',
      options: [
        'useState',
        'useMemo',
        'useEffect',
        'useCallback'
      ],
      correctOptionIndex: 2,
      marks: 3,
    });

    await Question.create({
      examId,
      type: 'mcq',
      questionText: 'What HTTP status code must the backend return when a JWT authentication token is expired or completely missing?',
      options: [
        '200 OK',
        '400 Bad Request',
        '401 Unauthorized',
        '403 Forbidden'
      ],
      correctOptionIndex: 2,
      marks: 3,
    });

    // Add Coding Challenges
    await Question.create({
      examId,
      type: 'code',
      questionText: 'Problem Statement: Implement a function `isPalindrome(str)` that checks whether a given string is a palindrome (reads identical forwards and backwards), ignoring case and punctuation.',
      starterCode: `function isPalindrome(str) {
  // Step 1: Clean the string (remove non-alphanumeric chars & lowercase)
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Step 2: Compare with reversed version
  return clean === clean.split('').reverse().join('');
}

// Test call
console.log(isPalindrome("A man, a plan, a canal: Panama")); // Expected: true`,
      sampleInput: '"racecar"',
      sampleOutput: 'true',
      marks: 5,
    });

    await Question.create({
      examId,
      type: 'code',
      questionText: 'Problem Statement: Write a function `calculateTrustScore(totalViolations, maxAllowed = 3)` that returns the student\'s remaining proctor trust percentage. Return 0 if violations reach or exceed maxAllowed.',
      starterCode: `function calculateTrustScore(totalViolations, maxAllowed = 3) {
  if (totalViolations >= maxAllowed) return 0;
  const penaltyPerViolation = 100 / maxAllowed;
  return Math.max(0, Math.round(100 - (totalViolations * penaltyPerViolation)));
}

// Test call
console.log(calculateTrustScore(1)); // Expected: ~67%`,
      sampleInput: 'totalViolations = 1, maxAllowed = 3',
      sampleOutput: '67',
      marks: 6,
    });

    console.log(`🎉 Demo Exam created with Access Code: DEV101 (5 questions, 20 total marks)`);
  } catch (error) {
    console.error('Seed error:', error);
  }
};

module.exports = seedInitialData;

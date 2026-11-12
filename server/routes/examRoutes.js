const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const ProctorLog = require('../models/ProctorLog');
const { verifyToken, requireTeacher } = require('../middleware/authMiddleware');

// Helper to generate unique 6-char uppercase alphanumeric code
const generateUniqueCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused 0, O, 1, I
  let code = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    const existing = await Exam.findOne({ examCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// Teacher: Get all exams created by current teacher
router.get('/', verifyToken, requireTeacher, async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    
    // Add question count and submission count to each exam summary
    const enhancedExams = await Promise.all(
      exams.map(async (exam) => {
        const examId = String(exam._id);
        const questionCount = await Question.countDocuments({ examId });
        const submissionCount = await Submission.countDocuments({ examId });
        return {
          ...exam.toJSON ? exam.toJSON() : exam,
          questionCount,
          submissionCount,
        };
      })
    );

    return res.json({ exams: enhancedExams });
  } catch (error) {
    console.error('Fetch exams error:', error);
    return res.status(500).json({ message: 'Failed to retrieve exams', error: error.message });
  }
});

// Student & Teacher: Lookup exam by 6-character access code
router.get('/code/:code', verifyToken, async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const exam = await Exam.findOne({ examCode: code, isActive: true });

    if (!exam) {
      return res.status(404).json({ message: 'Invalid or inactive exam access code.' });
    }

    const questionCount = await Question.countDocuments({ examId: String(exam._id) });

    // Check if student has already completed or terminated this exam
    let existingSubmission = null;
    if (req.user.role === 'student') {
      existingSubmission = await Submission.findOne({
        examId: String(exam._id),
        studentId: req.user.id,
      });
    }

    return res.json({
      exam: {
        id: String(exam._id),
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        passingScore: exam.passingScore,
        examCode: exam.examCode,
        maxWarnings: exam.maxWarnings,
        questionCount,
        existingSubmission: existingSubmission ? {
          id: String(existingSubmission._id),
          status: existingSubmission.status,
          totalScore: existingSubmission.totalScore,
          submittedAt: existingSubmission.submittedAt,
        } : null,
      },
    });
  } catch (error) {
    console.error('Exam code lookup error:', error);
    return res.status(500).json({ message: 'Error checking exam code', error: error.message });
  }
});

// Teacher: Get single exam by ID (with questions)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only creator teacher or taking student can access
    const isTeacherOwner = String(exam.createdBy) === req.user.id || req.user.role === 'teacher';
    if (!isTeacherOwner && req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const questions = await Question.find({ examId: String(exam._id) });

    // Sanitize questions if student is viewing outside submission
    const sanitizedQuestions = questions.map(q => {
      const qObj = q.toJSON ? q.toJSON() : q;
      if (req.user.role === 'student') {
        delete qObj.correctOptionIndex;
      }
      return qObj;
    });

    return res.json({
      exam,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('Get exam details error:', error);
    return res.status(500).json({ message: 'Failed to retrieve exam details', error: error.message });
  }
});

// Teacher: Create a new exam
router.post('/', verifyToken, requireTeacher, async (req, res) => {
  try {
    const { title, description, durationMinutes, passingScore, maxWarnings } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Exam title is required.' });
    }

    const examCode = await generateUniqueCode();

    const newExam = await Exam.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user.id,
      durationMinutes: Number(durationMinutes) || 30,
      passingScore: Number(passingScore) || 50,
      examCode,
      maxWarnings: Number(maxWarnings) || 3,
      isActive: true,
    });

    return res.status(201).json({
      message: 'Exam created successfully',
      exam: newExam,
    });
  } catch (error) {
    console.error('Create exam error:', error);
    return res.status(500).json({ message: 'Failed to create exam', error: error.message });
  }
});

// Teacher: Update exam details
router.put('/:id', verifyToken, requireTeacher, async (req, res) => {
  try {
    const { title, description, durationMinutes, passingScore, maxWarnings, isActive } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (String(exam.createdBy) !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this exam.' });
    }

    const updated = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        title: title !== undefined ? title.trim() : exam.title,
        description: description !== undefined ? description.trim() : exam.description,
        durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : exam.durationMinutes,
        passingScore: passingScore !== undefined ? Number(passingScore) : exam.passingScore,
        maxWarnings: maxWarnings !== undefined ? Number(maxWarnings) : exam.maxWarnings,
        isActive: isActive !== undefined ? Boolean(isActive) : exam.isActive,
      },
      { new: true }
    );

    return res.json({ message: 'Exam updated successfully', exam: updated });
  } catch (error) {
    console.error('Update exam error:', error);
    return res.status(500).json({ message: 'Failed to update exam', error: error.message });
  }
});

// Teacher: Delete exam and associated data
router.delete('/:id', verifyToken, requireTeacher, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (String(exam.createdBy) !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this exam.' });
    }

    const examId = String(exam._id);
    await Question.deleteMany({ examId });
    
    // Find submissions to clear logs
    const submissions = await Submission.find({ examId });
    for (const sub of submissions) {
      await ProctorLog.deleteMany({ submissionId: String(sub._id) });
    }
    await Submission.deleteMany({ examId });
    await Exam.findByIdAndDelete(examId);

    return res.json({ message: 'Exam and all associated records deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    return res.status(500).json({ message: 'Failed to delete exam', error: error.message });
  }
});

// Phase 5: Teacher Exam Results & Proctoring Audit Report
router.get('/:id/audit-report', verifyToken, requireTeacher, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const examId = String(exam._id);
    const submissions = await Submission.find({ examId }).populate('studentId', 'name email');
    const questions = await Question.find({ examId });
    const maxScore = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

    const reports = await Promise.all(
      submissions.map(async (sub) => {
        const subId = String(sub._id);
        const logs = await ProctorLog.find({ submissionId: subId }).sort({ timestamp: 1 });
        
        // Calculate proctoring trust score (Starts at 100%, deducts 25% per warning)
        const warningCount = logs.length;
        let trustScore = Math.max(0, 100 - (warningCount * 30));
        if (sub.status === 'terminated') {
          trustScore = 0;
        }

        // Calculate time taken
        let durationSeconds = 0;
        if (sub.startedAt && sub.submittedAt) {
          durationSeconds = Math.round((new Date(sub.submittedAt).getTime() - new Date(sub.startedAt).getTime()) / 1000);
        } else if (sub.startedAt) {
          durationSeconds = Math.round((Date.now() - new Date(sub.startedAt).getTime()) / 1000);
        }

        const percentage = maxScore > 0 ? Math.round((sub.totalScore / maxScore) * 100) : 0;
        const isPassed = percentage >= (exam.passingScore || 50);

        return {
          submissionId: subId,
          student: sub.studentId || { name: 'Unknown Student', email: 'N/A' },
          totalScore: sub.totalScore,
          maxScore,
          percentage,
          isPassed,
          status: sub.status, // 'in-progress' | 'completed' | 'terminated'
          terminationReason: sub.terminationReason,
          startedAt: sub.startedAt,
          submittedAt: sub.submittedAt,
          durationSeconds,
          warningCount,
          trustScore,
          proctorLogs: logs,
        };
      })
    );

    return res.json({
      exam,
      maxScore,
      totalAttempts: submissions.length,
      reports,
    });
  } catch (error) {
    console.error('Audit report fetch error:', error);
    return res.status(500).json({ message: 'Failed to generate proctoring audit report', error: error.message });
  }
});

module.exports = router;

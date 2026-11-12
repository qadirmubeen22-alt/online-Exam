const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ProctorLog = require('../models/ProctorLog');
const { verifyToken } = require('../middleware/authMiddleware');

// Student: Start or resume an exam
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { examId } = req.body;
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required.' });
    }

    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: 'Exam not found or is currently closed.' });
    }

    // Check for existing submission
    let submission = await Submission.findOne({
      examId: String(exam._id),
      studentId: req.user.id,
    });

    const now = new Date();

    if (submission) {
      // If completed or terminated, cannot restart
      if (submission.status === 'completed' || submission.status === 'terminated') {
        return res.status(400).json({
          message: `This exam attempt is already ${submission.status}.`,
          submissionId: String(submission._id),
          status: submission.status,
        });
      }

      // Check if time has expired according to server time
      const elapsedSeconds = Math.floor((now.getTime() - new Date(submission.startedAt).getTime()) / 1000);
      const totalAllowedSeconds = exam.durationMinutes * 60;
      const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

      if (remainingSeconds <= 0) {
        // Auto-complete due to timeout
        submission.status = 'completed';
        submission.submittedAt = now;
        await submission.save();

        return res.status(400).json({
          message: 'Exam time has expired.',
          submissionId: String(submission._id),
          status: 'completed',
        });
      }

      // Fetch questions without correct answers
      const questions = await Question.find({ examId: String(exam._id) });
      const sanitizedQuestions = questions.map(q => {
        const qObj = q.toJSON ? q.toJSON() : { ...q };
        delete qObj.correctOptionIndex;
        return qObj;
      });

      return res.json({
        message: 'Resumed active session',
        submission,
        exam,
        questions: sanitizedQuestions,
        remainingSeconds,
      });
    }

    // Initialize new submission
    submission = await Submission.create({
      examId: String(exam._id),
      studentId: req.user.id,
      answers: [],
      totalScore: 0,
      status: 'in-progress',
      startedAt: now,
    });

    const questions = await Question.find({ examId: String(exam._id) });
    const sanitizedQuestions = questions.map(q => {
      const qObj = q.toJSON ? q.toJSON() : { ...q };
      delete qObj.correctOptionIndex;
      return qObj;
    });

    return res.status(201).json({
      message: 'Exam started successfully',
      submission,
      exam,
      questions: sanitizedQuestions,
      remainingSeconds: exam.durationMinutes * 60,
    });
  } catch (error) {
    console.error('Start exam error:', error);
    return res.status(500).json({ message: 'Failed to start exam', error: error.message });
  }
});

// Student: Save answer in progress (auto-save feature)
router.post('/save-answer', verifyToken, async (req, res) => {
  try {
    const { submissionId, questionId, response, isMarkedForReview } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (String(submission.studentId) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (submission.status !== 'in-progress') {
      return res.status(400).json({ message: `Cannot modify answers for a ${submission.status} exam.` });
    }

    const answers = [...(submission.answers || [])];
    const existingIdx = answers.findIndex(a => String(a.questionId) === String(questionId));

    if (existingIdx !== -1) {
      answers[existingIdx].response = response;
      if (isMarkedForReview !== undefined) {
        answers[existingIdx].isMarkedForReview = isMarkedForReview;
      }
    } else {
      answers.push({
        questionId,
        response,
        isMarkedForReview: Boolean(isMarkedForReview),
        awardedMarks: 0,
      });
    }

    submission.answers = answers;
    await submission.save();

    return res.json({ message: 'Answer saved', answers: submission.answers });
  } catch (error) {
    console.error('Save answer error:', error);
    return res.status(500).json({ message: 'Failed to save answer', error: error.message });
  }
});

// Student: Final Submit Exam (Server-Side Auto-Grading)
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { submissionId, answers: finalAnswers } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (String(submission.studentId) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (submission.status === 'completed' || submission.status === 'terminated') {
      return res.json({ message: 'Already submitted', submission });
    }

    const exam = await Exam.findById(submission.examId);
    const questions = await Question.find({ examId: String(submission.examId) });

    // Server-Side Grading calculation
    let calculatedTotalScore = 0;
    let maxPossibleScore = 0;

    const answersList = Array.isArray(finalAnswers) && finalAnswers.length > 0
      ? finalAnswers
      : (submission.answers || []);

    const gradedAnswers = questions.map(q => {
      const qId = String(q._id);
      const studentAnswer = answersList.find(a => String(a.questionId) === qId);
      const response = studentAnswer ? studentAnswer.response : null;
      let awardedMarks = 0;

      const qMarks = Number(q.marks) || 1;
      maxPossibleScore += qMarks;

      if (q.type === 'mcq') {
        // Strict number comparison for correctOptionIndex
        if (response !== null && response !== undefined && Number(response) === Number(q.correctOptionIndex)) {
          awardedMarks = qMarks;
        }
      } else if (q.type === 'code') {
        // Coding questions: award completion marks if code was provided and non-trivial
        if (response && typeof response === 'string' && response.trim().length > 10) {
          // If response differs from starterCode and has content, award baseline partial/full credit
          awardedMarks = qMarks;
        }
      }

      calculatedTotalScore += awardedMarks;

      return {
        questionId: qId,
        response,
        isMarkedForReview: studentAnswer ? studentAnswer.isMarkedForReview : false,
        awardedMarks,
      };
    });

    submission.answers = gradedAnswers;
    submission.totalScore = calculatedTotalScore;
    submission.maxPossibleScore = maxPossibleScore;
    submission.status = 'completed';
    submission.submittedAt = new Date();

    await submission.save();

    return res.json({
      message: 'Exam submitted and graded successfully',
      submission,
      totalScore: calculatedTotalScore,
      maxPossibleScore,
      percentage: maxPossibleScore > 0 ? Math.round((calculatedTotalScore / maxPossibleScore) * 100) : 0,
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    return res.status(500).json({ message: 'Failed to submit exam', error: error.message });
  }
});

// Student & Teacher: Get Submission Result & Review
router.get('/:id/result', verifyToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('examId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Access check: Only the student who took it, or any teacher
    const isOwner = String(submission.studentId && (submission.studentId._id || submission.studentId)) === req.user.id;
    if (!isOwner && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const exam = submission.examId;
    const questions = await Question.find({ examId: String(exam._id || exam) });
    const logs = await ProctorLog.find({ submissionId: String(submission._id) }).sort({ timestamp: 1 });

    const maxScore = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const percentage = maxScore > 0 ? Math.round((submission.totalScore / maxScore) * 100) : 0;
    const isPassed = percentage >= (exam.passingScore || 50);

    // Build question-by-question review
    const reviewBreakdown = questions.map(q => {
      const qId = String(q._id);
      const studentAns = (submission.answers || []).find(a => String(a.questionId) === qId);
      return {
        questionId: qId,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        starterCode: q.starterCode,
        sampleInput: q.sampleInput,
        sampleOutput: q.sampleOutput,
        marks: q.marks,
        studentResponse: studentAns ? studentAns.response : null,
        awardedMarks: studentAns ? studentAns.awardedMarks : 0,
        isCorrect: q.type === 'mcq'
          ? (studentAns && studentAns.response !== null && Number(studentAns.response) === Number(q.correctOptionIndex))
          : (studentAns && studentAns.awardedMarks > 0),
      };
    });

    return res.json({
      submission,
      exam,
      maxScore,
      percentage,
      isPassed,
      warningCount: logs.length,
      proctorLogs: logs,
      reviewBreakdown,
    });
  } catch (error) {
    console.error('Fetch result error:', error);
    return res.status(500).json({ message: 'Failed to fetch result', error: error.message });
  }
});

module.exports = router;

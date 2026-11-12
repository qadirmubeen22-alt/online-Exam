const express = require('express');
const router = express.Router();
const ProctorLog = require('../models/ProctorLog');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const { verifyToken } = require('../middleware/authMiddleware');

// Log a proctoring violation and check 3-strike rule
router.post('/log', verifyToken, async (req, res) => {
  try {
    const { submissionId, violationType, details } = req.body;

    if (!submissionId || !violationType) {
      return res.status(400).json({ message: 'Submission ID and violation type are required.' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // If submission is already finished, ignore
    if (submission.status === 'completed' || submission.status === 'terminated') {
      return res.json({
        message: 'Exam already closed',
        isTerminated: true,
        status: submission.status,
      });
    }

    const exam = await Exam.findById(submission.examId);
    const maxAllowedWarnings = (exam && exam.maxWarnings) ? exam.maxWarnings : 3;

    // Count existing violations for this submission
    const existingLogsCount = await ProctorLog.countDocuments({ submissionId: String(submission._id) });
    const currentWarningNumber = existingLogsCount + 1;

    // Create violation log
    const log = await ProctorLog.create({
      submissionId: String(submission._id),
      violationType,
      details: details || `Proctor warning #${currentWarningNumber} triggered for ${violationType}`,
      warningNumber: currentWarningNumber,
      timestamp: new Date(),
    });

    // Check if 3 strikes reached
    let isTerminated = false;
    if (currentWarningNumber >= maxAllowedWarnings) {
      isTerminated = true;
      submission.status = 'terminated';
      submission.submittedAt = new Date();
      submission.terminationReason = `Terminated: Triggered ${currentWarningNumber} academic integrity violations (${violationType}).`;
      await submission.save();
    }

    const remainingWarnings = Math.max(0, maxAllowedWarnings - currentWarningNumber);

    return res.status(201).json({
      message: isTerminated
        ? `Maximum violations reached (${currentWarningNumber}/${maxAllowedWarnings}). Exam terminated.`
        : `Proctoring warning recorded (${currentWarningNumber}/${maxAllowedWarnings}).`,
      warningNumber: currentWarningNumber,
      maxWarnings: maxAllowedWarnings,
      remainingWarnings,
      isTerminated,
      log,
      submissionStatus: submission.status,
    });
  } catch (error) {
    console.error('Proctor log error:', error);
    return res.status(500).json({ message: 'Failed to record proctoring log', error: error.message });
  }
});

// Get all proctor logs for a submission
router.get('/logs/:submissionId', verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const logs = await ProctorLog.find({ submissionId }).sort({ timestamp: 1 });
    return res.json({ logs });
  } catch (error) {
    console.error('Fetch proctor logs error:', error);
    return res.status(500).json({ message: 'Failed to fetch proctor logs', error: error.message });
  }
});

module.exports = router;

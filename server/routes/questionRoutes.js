const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const { verifyToken, requireTeacher } = require('../middleware/authMiddleware');

// Get questions for an exam
router.get('/exam/:examId', verifyToken, async (req, res) => {
  try {
    const { examId } = req.params;
    const questions = await Question.find({ examId });

    // Hide correct answers if student is requesting directly
    const formatted = questions.map(q => {
      const qObj = q.toJSON ? q.toJSON() : { ...q };
      if (req.user.role === 'student') {
        delete qObj.correctOptionIndex;
      }
      return qObj;
    });

    return res.json({ questions: formatted });
  } catch (error) {
    console.error('Fetch questions error:', error);
    return res.status(500).json({ message: 'Failed to fetch questions', error: error.message });
  }
});

// Teacher: Create a new question for an exam
router.post('/', verifyToken, requireTeacher, async (req, res) => {
  try {
    const { examId, type, questionText, options, correctOptionIndex, starterCode, sampleInput, sampleOutput, marks } = req.body;

    if (!examId || !type || !questionText) {
      return res.status(400).json({ message: 'Exam ID, type, and question text are required.' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Associated exam not found.' });
    }

    if (String(exam.createdBy) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to add questions to this exam.' });
    }

    let parsedOptions = options || [];
    if (typeof parsedOptions === 'string') {
      try { parsedOptions = JSON.parse(parsedOptions); } catch (e) { parsedOptions = []; }
    }

    const newQuestion = await Question.create({
      examId,
      type: type === 'code' ? 'code' : 'mcq',
      questionText: questionText.trim(),
      options: parsedOptions,
      correctOptionIndex: Number(correctOptionIndex) || 0,
      starterCode: starterCode || '',
      sampleInput: sampleInput || '',
      sampleOutput: sampleOutput || '',
      marks: Number(marks) || 1,
    });

    return res.status(201).json({
      message: 'Question added successfully',
      question: newQuestion,
    });
  } catch (error) {
    console.error('Create question error:', error);
    return res.status(500).json({ message: 'Failed to create question', error: error.message });
  }
});

// Teacher: Update a question
router.put('/:id', verifyToken, requireTeacher, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const exam = await Exam.findById(question.examId);
    if (!exam || String(exam.createdBy) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this question.' });
    }

    const { questionText, options, correctOptionIndex, starterCode, sampleInput, sampleOutput, marks } = req.body;

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      {
        questionText: questionText !== undefined ? questionText.trim() : question.questionText,
        options: options !== undefined ? options : question.options,
        correctOptionIndex: correctOptionIndex !== undefined ? Number(correctOptionIndex) : question.correctOptionIndex,
        starterCode: starterCode !== undefined ? starterCode : question.starterCode,
        sampleInput: sampleInput !== undefined ? sampleInput : question.sampleInput,
        sampleOutput: sampleOutput !== undefined ? sampleOutput : question.sampleOutput,
        marks: marks !== undefined ? Number(marks) : question.marks,
      },
      { new: true }
    );

    return res.json({ message: 'Question updated successfully', question: updated });
  } catch (error) {
    console.error('Update question error:', error);
    return res.status(500).json({ message: 'Failed to update question', error: error.message });
  }
});

// Teacher: Delete a question
router.delete('/:id', verifyToken, requireTeacher, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const exam = await Exam.findById(question.examId);
    if (!exam || String(exam.createdBy) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this question.' });
    }

    await Question.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    return res.status(500).json({ message: 'Failed to delete question', error: error.message });
  }
});

module.exports = router;

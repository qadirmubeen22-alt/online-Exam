const mongoose = require('mongoose');
const { getIsConnectedToMongo } = require('../config/db');
const { FileModel } = require('./fileStore');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  response: {
    type: mongoose.Schema.Types.Mixed, // string (code or option index)
    default: null,
  },
  isMarkedForReview: {
    type: Boolean,
    default: false,
  },
  awardedMarks: {
    type: Number,
    default: 0,
  },
});

const SubmissionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [AnswerSchema],
  totalScore: {
    type: Number,
    default: 0,
  },
  maxPossibleScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'terminated'],
    default: 'in-progress',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  terminationReason: {
    type: String,
    default: '',
  },
});

const MongoSubmissionModel = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
const FileSubmissionModel = new FileModel('submissions');

module.exports = new Proxy(MongoSubmissionModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return target[prop];
    }
    return FileSubmissionModel[prop];
  }
});

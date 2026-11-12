const mongoose = require('mongoose');
const { getIsConnectedToMongo } = require('../config/db');
const { FileModel } = require('./fileStore');

const QuestionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'code'],
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  // MCQ specific fields
  options: {
    type: [String],
    default: [],
  },
  correctOptionIndex: {
    type: Number,
    default: 0,
  },
  // Coding specific fields
  starterCode: {
    type: String,
    default: '',
  },
  sampleInput: {
    type: String,
    default: '',
  },
  sampleOutput: {
    type: String,
    default: '',
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongoQuestionModel = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
const FileQuestionModel = new FileModel('questions');

module.exports = new Proxy(MongoQuestionModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return target[prop];
    }
    return FileQuestionModel[prop];
  }
});

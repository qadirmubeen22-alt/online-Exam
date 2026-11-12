const mongoose = require('mongoose');
const { getIsConnectedToMongo } = require('../config/db');
const { FileModel } = require('./fileStore');

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1,
    default: 30,
  },
  passingScore: {
    type: Number,
    default: 50, // Percentage or marks
  },
  examCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  maxWarnings: {
    type: Number,
    default: 3,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongoExamModel = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
const FileExamModel = new FileModel('exams');

module.exports = new Proxy(MongoExamModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return target[prop];
    }
    return FileExamModel[prop];
  }
});

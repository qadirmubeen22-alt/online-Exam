const mongoose = require('mongoose');
const { getIsConnectedToMongo } = require('../config/db');
const { FileModel } = require('./fileStore');

const ProctorLogSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
  },
  violationType: {
    type: String,
    enum: ['tab_switch', 'fullscreen_exit', 'copy_attempt', 'multiple_faces', 'other'],
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  warningNumber: {
    type: Number,
    required: true,
    default: 1,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const MongoProctorLogModel = mongoose.models.ProctorLog || mongoose.model('ProctorLog', ProctorLogSchema);
const FileProctorLogModel = new FileModel('proctorlogs');

module.exports = new Proxy(MongoProctorLogModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return target[prop];
    }
    return FileProctorLogModel[prop];
  }
});

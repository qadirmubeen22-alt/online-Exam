const mongoose = require('mongoose');
const { getIsConnectedToMongo } = require('../config/db');
const { FileModel } = require('./fileStore');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    default: 'student',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongoUserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const FileUserModel = new FileModel('users');

module.exports = new Proxy(MongoUserModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return target[prop];
    }
    return FileUserModel[prop];
  },
  apply(target, thisArg, argumentsList) {
    if (getIsConnectedToMongo()) {
      return Reflect.apply(target, thisArg, argumentsList);
    }
    return new FileUserModel.constructor('users');
  }
});

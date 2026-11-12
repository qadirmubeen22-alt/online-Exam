const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnectedToMongo = false;
let dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exam_proctor';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnectedToMongo = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.log(`⚠️  MongoDB not detected locally (${error.message}).`);
    console.log(`⚡ Activating built-in Zero-Config JSON Data Engine for 100% full offline capability.`);
    isConnectedToMongo = false;
    return false;
  }
};

const getIsConnectedToMongo = () => isConnectedToMongo;

module.exports = {
  connectDB,
  getIsConnectedToMongo,
  dataDir
};

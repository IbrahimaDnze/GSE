const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Drop old unique index on Subject.name to allow same name for different levels
    try {
      await conn.connection.db.collection('subjects').dropIndex('name_1');
      console.log('Dropped old unique index on subjects.name');
    } catch { /* index already gone */ }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

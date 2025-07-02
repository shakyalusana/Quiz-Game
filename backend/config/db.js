const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const MONGO_URI = 'mongodb://127.0.0.1:27017/quiz'
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('MongoDB Connected Successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB

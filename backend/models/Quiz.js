const mongoose = require("mongoose")

const quizResultSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  answers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
      selectedOption: {
        type: Number,
      },
      isCorrect: {
        type: Boolean,
      },
    },
  ],
})

const QuizResult = mongoose.model("QuizResult", quizResultSchema)

module.exports = QuizResult

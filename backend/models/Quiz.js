const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
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
          ref: 'Question',
          required: true,
        },
        selectedOption: {
          type: String,
          required: false,
          default: null,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
          required: true,
        },
      },
    ],
    stats: {
      easy: {
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      medium: {
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      hard: {
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
)

const QuizResult = mongoose.model('Quiz', quizSchema)

module.exports = QuizResult

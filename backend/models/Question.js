const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      validate: [(arr) => arr.length >= 2, 'At least 2 options are required'],
      required: true,
    },
    correctOption: {
      type: Number,
      required: true,
      validate: {
        validator: function (index) {
          return this.options && index >= 0 && index < this.options.length
        },
        message: 'Correct option index is out of bounds',
      },
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Question', questionSchema)

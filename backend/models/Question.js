const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => {
          return v.length >= 4 // 4 options
        },
        message: "Question must have at least 4 options",
      },
    },
    correctOption: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return v >= 0 && v < this.options.length
        },
        message: "Correct option index must be valid",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true },
)

const Question = mongoose.model("Question", questionSchema)

module.exports = Question

const express = require("express")
const QuizResult = require("../models/Quiz")
const Question = require("../models/Question")
const Category = require("../models/Category")
const auth = require("../middleware/auth")

const router = express.Router()

// Submit quiz results
router.post("/submit", auth, async (req, res) => {
  try {
    const { categoryId, results, score } = req.body

    // Validate inputs
    if (!categoryId || !results || score === undefined) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Check if category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Create quiz result
    const quizResult = new QuizResult({
      player: req.user.userId,
      category: categoryId,
      score,
      totalQuestions: results.length,
      answers: results.map((result) => ({
        question: result.questionId,
        selectedOption: result.selectedOption,
        isCorrect: result.isCorrect,
      })),
    })

    await quizResult.save()

    res.status(201).json({ message: "Quiz results submitted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

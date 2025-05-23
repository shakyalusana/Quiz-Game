const express = require("express")
const QuizResult = require("../models/Quiz")
const Category = require("../models/Category")
const auth = require("../middleware/auth")
const mongoose = require("mongoose")

const router = express.Router()

// Get player's quiz history
router.get("/history", auth, async (req, res) => {
  try {
    // Get player's quiz results
    const quizResults = await QuizResult.find({ player: req.user.userId })
      .populate("category", "name")
      .sort("-date")
      .limit(20)

    // Calculate statistics
    const stats = {
      totalQuizzes: quizResults.length,
      averageScore: 0,
      bestCategory: "",
      worstCategory: "",
    }

    if (quizResults.length > 0) {
      // Calculate average score
      const totalScore = quizResults.reduce((sum, quiz) => {
        return sum + (quiz.score / quiz.totalQuestions) * 100
      }, 0)
      stats.averageScore = totalScore / quizResults.length

      // Calculate best and worst categories
      const categoryStats = {}

      quizResults.forEach((quiz) => {
        const categoryId = quiz.category._id.toString()
        const categoryName = quiz.category.name
        const score = (quiz.score / quiz.totalQuestions) * 100

        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            name: categoryName,
            scores: [],
            average: 0,
          }
        }

        categoryStats[categoryId].scores.push(score)
      })

      // Calculate average score for each category
      Object.keys(categoryStats).forEach((categoryId) => {
        const category = categoryStats[categoryId]
        const totalScore = category.scores.reduce((sum, score) => sum + score, 0)
        category.average = totalScore / category.scores.length
      })

      // Find best and worst categories
      let bestCategoryId = null
      let worstCategoryId = null
      let bestScore = -1
      let worstScore = 101

      Object.keys(categoryStats).forEach((categoryId) => {
        const category = categoryStats[categoryId]

        if (category.average > bestScore) {
          bestScore = category.average
          bestCategoryId = categoryId
        }

        if (category.average < worstScore) {
          worstScore = category.average
          worstCategoryId = categoryId
        }
      })

      stats.bestCategory = bestCategoryId ? categoryStats[bestCategoryId].name : ""
      stats.worstCategory = worstCategoryId ? categoryStats[worstCategoryId].name : ""
    }

    res.json({
      history: quizResults.map((quiz) => ({
        _id: quiz._id,
        date: quiz.date,
        category: quiz.category,
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
      })),
      stats,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

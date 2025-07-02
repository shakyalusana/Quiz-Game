const express = require('express')
const QuizResult = require('../models/Quiz')
const Question = require('../models/Question')
const Category = require('../models/Category')
const auth = require('../middleware/auth')
const { fisherYatesShuffle } = require('../utils/randomizer')

const router = express.Router()

// Get questions for quiz
router.post('/questions', auth, async (req, res) => {
  try {
    const { categoryId, difficulty = 'medium', count = 10 } = req.body

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' })
    }

    // Get questions matching the category and difficulty
    const questions = await Question.find({
      category: categoryId,
      difficulty: difficulty,
    }).lean()

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        message: `No questions available for this category with ${difficulty} difficulty`,
      })
    }

    // Shuffle the questions and limit to requested count
    const shuffledQuestions = fisherYatesShuffle(questions).slice(
      0,
      Math.min(count, questions.length)
    )

    // Map questions to include only necessary fields and convert correctOption to actual value
    const formattedQuestions = shuffledQuestions.map((question) => ({
      _id: question._id,
      text: question.text,
      options: question.options,
      difficulty: question.difficulty,
      category: question.category,
      correctOption: question.options[question.correctOption], // Convert index to actual option value
    }))

    res.json(formattedQuestions)
  } catch (err) {
    console.error('Error fetching quiz questions:', err)
    res.status(500).json({ message: 'Error fetching quiz questions' })
  }
})

// Submit quiz results
router.post('/submit', auth, async (req, res) => {
  try {
    const { categoryId, answers, score, stats } = req.body

    // Validate inputs
    if (!categoryId || !answers || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Check if category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    // Create quiz result
    const quizResult = new QuizResult({
      player: req.user.userId,
      category: categoryId,
      score,
      totalQuestions: answers.length,
      answers: answers.map((answer) => ({
        question: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        points: answer.points,
        difficulty: answer.difficulty,
      })),
      stats,
    })

    await quizResult.save()

    res.status(201).json({ message: 'Quiz results submitted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

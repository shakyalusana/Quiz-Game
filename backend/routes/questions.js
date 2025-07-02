const express = require('express')
const mongoose = require('mongoose')
const Question = require('../models/Question')
const Category = require('../models/Category')
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/adminAuth')
const { body, validationResult } = require('express-validator')
const validateQuestion = require('../middleware/validateQuestion')

const router = express.Router()

// PUBLIC route - Get quiz questions
router.get('/quiz', async (req, res) => {
  try {
    const { categoryId, count = 5 } = req.query

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' })
    }

    const questions = await Question.aggregate([
      { $match: { category: new mongoose.Types.ObjectId(categoryId) } },
      { $sample: { size: Number(count) } },
    ])

    await Question.populate(questions, { path: 'category', select: 'name' })

    res.json(questions)
  } catch (error) {
    console.error('Error fetching quiz questions:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// ✅ PROTECTED routes (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.find().populate('category')
    res.json(questions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate(
      'category',
      'name'
    )
    if (!question) {
      return res.status(404).json({ message: 'Question not found' })
    }
    res.json(question)
  } catch (error) {
    console.error(error)
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid question ID' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// Get questions by difficulty
router.get('/difficulty/:level', auth, async (req, res) => {
  try {
    const { level } = req.params
    if (!['easy', 'medium', 'hard'].includes(level)) {
      return res.status(400).json({ message: 'Invalid difficulty level' })
    }
    const questions = await Question.find({ difficulty: level }).populate(
      'category'
    )
    res.json(questions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get question count for a category
router.get('/count/:categoryId', auth, async (req, res) => {
  try {
    const count = await Question.countDocuments({
      category: req.params.categoryId,
    })
    res.json({ count })
  } catch (error) {
    console.error('Error getting question count:', error)
    res.status(500).json({ message: 'Error getting question count' })
  }
})

router.post('/', [auth, adminAuth, validateQuestion], async (req, res) => {
  try {
    const {
      text,
      options,
      correctOption,
      category,
      difficulty = 'medium',
    } = req.body

    const question = new Question({
      text,
      options,
      correctOption,
      category,
      difficulty,
    })

    const newQuestion = await question.save()
    await newQuestion.populate('category')
    res.status(201).json(newQuestion)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.patch('/:id', [auth, adminAuth, validateQuestion], async (req, res) => {
  try {
    const { text, options, correctOption, category, difficulty } = req.body
    const updates = {}

    if (text) updates.text = text
    if (options) updates.options = options
    if (correctOption !== undefined) updates.correctOption = correctOption
    if (category) updates.category = category
    if (difficulty) updates.difficulty = difficulty

    const question = await Question.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).populate('category')

    if (!question) {
      return res.status(404).json({ message: 'Question not found' })
    }

    res.json(question)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: 'Question not found' })
    }
    await question.deleteOne()
    res.json({ message: 'Question deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

const express = require("express")
const Question = require("../models/Question")
const Category = require("../models/Category")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")
const mongoose = require("mongoose") // Added missing mongoose import

const router = express.Router()

// Get all questions (admin only)
router.get("/", [auth, adminAuth], async (req, res) => {
  try {
    const questions = await Question.find().populate("category", "name").sort("-createdAt")
    res.json(questions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get questions for a quiz
router.get("/quiz", auth, async (req, res) => {
  try {
    const { categoryId, count = 5 } = req.query

    // Validate inputs
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" })
    }

    // Check if category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Get random questions from the category
    const questions = await Question.aggregate([
      { $match: { category: mongoose.Types.ObjectId(categoryId) } },
      { $sample: { size: Number.parseInt(count) } },
    ])

    // Populate category information
    await Question.populate(questions, { path: "category", select: "name" })

    res.json(questions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new question (admin only)
router.post("/", [auth, adminAuth], async (req, res) => {
  try {
    const { text, options, correctOption, categoryId } = req.body

    // Check if category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Create new question
    const question = new Question({
      text,
      options,
      correctOption,
      category: categoryId,
    })

    await question.save()

    // Populate category information
    await question.populate("category", "name")

    res.status(201).json(question)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update a question (admin only)
router.put("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const { text, options, correctOption, categoryId } = req.body

    // Check if question exists
    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if category exists
    if (categoryId) {
      const category = await Category.findById(categoryId)
      if (!category) {
        return res.status(404).json({ message: "Category not found" })
      }
    }

    // Update question
    question.text = text || question.text
    question.options = options || question.options
    question.correctOption = correctOption !== undefined ? correctOption : question.correctOption
    question.category = categoryId || question.category

    await question.save()

    // Populate category information
    await question.populate("category", "name")

    res.json(question)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete a question (admin only)
router.delete("/:id", [auth, adminAuth], async (req, res) => {
  try {
    // Check if question exists
    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Delete question
    await question.remove()

    res.json({ message: "Question deleted" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

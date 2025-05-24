const express = require("express");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Category = require("../models/Category");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Get all questions (admin only)
router.get("/", [auth, adminAuth], async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("category", "name")
      .sort("-createdAt");
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get questions for a quiz
router.get("/quiz", auth, async (req, res) => {
  try {
    const { categoryId, count = 5 } = req.query;

    const questions = await Question.aggregate([
      { $match: { category: new mongoose.Types.ObjectId(categoryId) } },
      { $sample: { size: Number(count) } },
    ]);

    await Question.populate(questions, { path: "category", select: "name" });

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a question
router.post("/", [auth, adminAuth], async (req, res) => {
  try {
    const { text, options, categoryId, correctOption } = req.body;

    const question = new Question({
      text,
      options,
      correctOption,
      category: categoryId,
    });

    await question.save();
    await question.populate("category", "name");

    res.status(201).json(question);
  } catch (error) {
    console.error("Error saving question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a question
router.put("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const { text, options, categoryId, correctOption } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    question.text = text;
    question.options = options;
    question.correctOption = correctOption;
    question.category = categoryId;

    await question.save();
    await question.populate("category", "name");

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// Delete a question
router.delete("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    await question.remove();
    res.json({ message: "Question deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

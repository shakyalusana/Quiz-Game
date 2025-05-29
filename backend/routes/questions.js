const express = require("express");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Category = require("../models/Category");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// PUBLIC route - Get quiz questions
router.get("/quiz", async (req, res) => {
  try {
    const { categoryId, count = 5 } = req.query;

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const questions = await Question.aggregate([
      { $match: { category: new mongoose.Types.ObjectId(categoryId) } },
      { $sample: { size: Number(count) } },
    ]);

    await Question.populate(questions, { path: "category", select: "name" });

    res.json(questions);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PROTECTED routes (admin only)
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

router.get("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate("category", "name");
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid question ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
});
const validateQuestion = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Question text is required"),

  body("options")
    .isArray({ min: 2 })
    .withMessage("Options must be an array with at least 2 items")
    .custom((opts) => opts.every(opt => typeof opt === "string" && opt.trim().length > 0))
    .withMessage("Each option must be a non-empty string"),

  body("correctOption")
    .isInt({ min: 0 }) // must be an integer >= 0
    .withMessage("Correct option must be a valid index")
    .custom((value, { req }) => {
      const options = req.body.options;
      if (!Array.isArray(options)) return false;
      return value >= 0 && value < options.length; // check index bounds
    })
    .withMessage("Correct option index must be within the range of options"),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid category ID"),
];


router.post("/", [auth, adminAuth, ...validateQuestion], async (req, res) => {
  // 1️⃣  gather validation errors (if any)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // ⚠️  send them back in the same shape express-validator uses
    return res.status(400).json({ errors: errors.array() });
  }

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

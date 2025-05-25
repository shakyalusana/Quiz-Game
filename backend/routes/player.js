// routes/player.js
const express = require("express");
const QuizResult = require("../models/Quiz");
const auth = require("../middleware/auth");

const router = express.Router();

// Get player's quiz history
router.get("/history", auth, async (req, res) => {
  try {
    // req.user should contain userId from decoded token
    const quizResults = await QuizResult.find({ player: req.user.userId })
      .populate("category", "name")
      .sort("-date")
      .limit(20);

    const stats = {
      totalQuizzes: quizResults.length,
      averageScore: 0,
      bestCategory: "",
      worstCategory: "",
    };
    const userId = req.user.userId;

    if (quizResults.length > 0) {
      const totalScore = quizResults.reduce((sum, quiz) => sum + (quiz.score / quiz.totalQuestions) * 100, 0);
      stats.averageScore = totalScore / quizResults.length;

      const categoryStats = {};

      quizResults.forEach((quiz) => {
        const categoryId = quiz.category._id.toString();
        const categoryName = quiz.category.name;
        const score = (quiz.score / quiz.totalQuestions) * 100;

        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            name: categoryName,
            scores: [],
            average: 0,
          };
        }

        categoryStats[categoryId].scores.push(score);
      });

      Object.keys(categoryStats).forEach((categoryId) => {
        const category = categoryStats[categoryId];
        const totalScore = category.scores.reduce((sum, s) => sum + s, 0);
        category.average = totalScore / category.scores.length;
      });

      let bestCategoryId = null;
      let worstCategoryId = null;
      let bestScore = -1;
      let worstScore = 101;

      Object.keys(categoryStats).forEach((categoryId) => {
        const category = categoryStats[categoryId];

        if (category.average > bestScore) {
          bestScore = category.average;
          bestCategoryId = categoryId;
        }

        if (category.average < worstScore) {
          worstScore = category.average;
          worstCategoryId = categoryId;
        }
      });

      stats.bestCategory = bestCategoryId ? categoryStats[bestCategoryId].name : "";
      stats.worstCategory = worstCategoryId ? categoryStats[worstCategoryId].name : "";
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
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

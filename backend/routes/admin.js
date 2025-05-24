const express = require("express")
const User = require("../models/User")
const QuizResult = require("../models/Quiz")
const Question = require("../models/Question")
const Category = require("../models/Category")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")
const mongoose = require("mongoose")

const router = express.Router()

// Get admin dashboard data
router.get("/dashboard", [auth, adminAuth], async (req, res) => {
  try {
    // Get counts
    const totalQuestions = await Question.countDocuments()
    const totalCategories = await Category.countDocuments()
    const totalPlayers = await User.countDocuments({ role: "player" })
    const totalQuizzes = await QuizResult.countDocuments()

    // Get recent players (safe divide by zero)
    const recentPlayers = await QuizResult.aggregate([
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$player",
          lastQuizDate: { $first: "$date" },
          lastScore: {
            $first: {
              $cond: [
                { $eq: ["$totalQuestions", 0] },
                0,
                { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] }
              ]
            }
          },
        },
      },
      { $limit: 5 },
    ])

    // Get player details
    const playerIds = recentPlayers.map((player) => player._id)
    const players = await User.find({ _id: { $in: playerIds } }, "name")

    // Map player names to results
    const playersMap = {}
    players.forEach((player) => {
      playersMap[player._id.toString()] = player.name
    })

    const recentPlayersWithNames = recentPlayers.map((player) => ({
      _id: player._id,
      name: playersMap[player._id.toString()] || "Unknown",
      lastQuizDate: player.lastQuizDate,
      lastScore: Math.round(player.lastScore),
    }))

    res.json({
      stats: {
        totalQuestions,
        totalCategories,
        totalPlayers,
        totalQuizzes,
      },
      recentPlayers: recentPlayersWithNames,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get leaderboard
router.get("/leaderboard", [auth, adminAuth], async (req, res) => {
  try {
    const results = await QuizResult.find().populate("player", "name").populate("category", "name")

    const playerStats = {}

    results.forEach((result) => {
      const playerId = result.player._id.toString()
      const playerName = result.player.name
      const categoryId = result.category._id.toString()
      const categoryName = result.category.name
      const score = result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0

      if (!playerStats[playerId]) {
        playerStats[playerId] = {
          _id: playerId,
          playerName,
          quizzesTaken: 0,
          totalScore: 0,
          bestScore: 0,
          categories: {},
        }
      }

      playerStats[playerId].quizzesTaken++
      playerStats[playerId].totalScore += score
      playerStats[playerId].bestScore = Math.max(playerStats[playerId].bestScore, score)

      if (!playerStats[playerId].categories[categoryId]) {
        playerStats[playerId].categories[categoryId] = {
          categoryId,
          categoryName,
          quizzesTaken: 0,
          totalScore: 0,
          bestScore: 0,
        }
      }

      playerStats[playerId].categories[categoryId].quizzesTaken++
      playerStats[playerId].categories[categoryId].totalScore += score
      playerStats[playerId].categories[categoryId].bestScore = Math.max(
        playerStats[playerId].categories[categoryId].bestScore,
        score
      )
    })

    const leaderboard = Object.values(playerStats).map((player) => {
      player.averageScore = player.quizzesTaken > 0 ? player.totalScore / player.quizzesTaken : 0

      Object.values(player.categories).forEach((category) => {
        category.averageScore = category.quizzesTaken > 0 ? category.totalScore / category.quizzesTaken : 0
      })

      return player
    })

    leaderboard.sort((a, b) => b.averageScore - a.averageScore)

    res.json(leaderboard)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all players
router.get("/players", [auth, adminAuth], async (req, res) => {
  try {
    const players = await User.find({ role: "player" }, "-password")

    const playerStats = await Promise.all(
      players.map(async (player) => {
        const quizResults = await QuizResult.find({ player: player._id })

        const quizzesTaken = quizResults.length
        let totalScore = 0
        let bestScore = 0

        quizResults.forEach((quiz) => {
          const score = quiz.totalQuestions > 0 ? (quiz.score / quiz.totalQuestions) * 100 : 0
          totalScore += score
          bestScore = Math.max(bestScore, score)
        })

        const averageScore = quizzesTaken > 0 ? totalScore / quizzesTaken : 0

        return {
          _id: player._id,
          name: player.name,
          email: player.email,
          quizzesTaken,
          averageScore,
          bestScore,
        }
      }),
    )

    playerStats.sort((a, b) => b.averageScore - a.averageScore)

    res.json(playerStats)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get player details
router.get("/players/:id", [auth, adminAuth], async (req, res) => {
  try {
    const player = await User.findById(req.params.id, "-password")

    if (!player) {
      return res.status(404).json({ message: "Player not found" })
    }

    const quizResults = await QuizResult.find({ player: player._id }).populate("category", "name").sort("-date")

    const quizzesTaken = quizResults.length
    let totalScore = 0
    let bestScore = 0

    quizResults.forEach((quiz) => {
      const score = quiz.totalQuestions > 0 ? (quiz.score / quiz.totalQuestions) * 100 : 0
      totalScore += score
      bestScore = Math.max(bestScore, score)
    })

    const averageScore = quizzesTaken > 0 ? totalScore / quizzesTaken : 0

    const recentQuizzes = quizResults.slice(0, 10).map((quiz) => ({
      _id: quiz._id,
      date: quiz.date,
      categoryName: quiz.category.name,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      scorePercentage: quiz.totalQuestions > 0 ? Math.round((quiz.score / quiz.totalQuestions) * 100) : 0,
    }))

    res.json({
      _id: player._id,
      name: player.name,
      email: player.email,
      createdAt: player.createdAt,
      quizzesTaken,
      averageScore,
      bestScore,
      recentQuizzes,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete player
router.delete("/players/:id", [auth, adminAuth], async (req, res) => {
  try {
    const player = await User.findById(req.params.id)

    if (!player) {
      return res.status(404).json({ message: "Player not found" })
    }

    await QuizResult.deleteMany({ player: player._id })
    await player.remove()

    res.json({ message: "Player deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

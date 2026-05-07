import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../../utils/axiosConfig'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/Navbar'
import { toast } from 'react-toastify'

function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'admin') {
      navigate('/player/dashboard')
      return
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch all data at the same time
        const [categoriesRes, playersRes, quizzesRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/admin/players'),
          axios.get('/api/admin/quizzes'),
        ])

        const categoriesData = categoriesRes.data
        const playersData = playersRes.data
        const quizzesData = quizzesRes.data

        // Build stats
        setStats({
          totalUsers: playersData.length,
          quizzesTaken: quizzesData.length,
          avgScore: quizzesData.length
            ? Math.round(
                quizzesData.reduce((sum, q) => sum + (q.score || 0), 0) /
                  quizzesData.length
              )
            : 0,
          totalQuestions: categoriesData.reduce(
            (sum, c) => sum + (c.questionCount || 0),
            0
          ),
        })

        setCategories(categoriesData)

        // Build leaderboard — sort players by their best score
        const leaderboardData = playersData
          .map((player) => {
            const playerQuizzes = quizzesData.filter(
              (q) => q.userId === player._id || q.user === player._id
            )
            const bestScore =
              playerQuizzes.length > 0
                ? Math.max(...playerQuizzes.map((q) => q.score || 0))
                : 0
            const avgAccuracy =
              playerQuizzes.length > 0
                ? Math.round(
                    playerQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) /
                      playerQuizzes.length
                  )
                : 0
            return {
              username: player.name,
              initials: player.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2),
              bestScore,
              quizzes: playerQuizzes.length,
              accuracy: avgAccuracy,
            }
          })
          .sort((a, b) => b.bestScore - a.bestScore)
          .map((player, index) => ({ ...player, rank: index + 1 }))

        setLeaderboard(leaderboardData)
        setLoading(false)
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load dashboard data'
        setError(message)
        toast.error(message)
        console.error(err)
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, navigate])

  // ── Accuracy bar color ──────────────────────────────────────────────────
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 85) return 'bg-green-500'
    if (accuracy >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // ── Rank badge ──────────────────────────────────────────────────────────
  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800'
    if (rank === 2) return 'bg-gray-100 text-gray-600'
    if (rank === 3) return 'bg-orange-100 text-orange-700'
    return 'bg-white text-gray-500'
  }

  // ── Max attempts for category bar width ────────────────────────────────
  const maxAttempts = categories.length
    ? Math.max(...categories.map((c) => c.attempts || c.questionCount || 1))
    : 1

  // ── Render ──────────────────────────────────────────────────────────────
  const renderDashboardContent = () => (
    <div className="max-w-5xl mx-auto">

      <h1 className="text-3xl font-bold text-center mb-8 text-purple-600">
        Admin Dashboard
      </h1>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Quizzes Taken</p>
          <p className="text-3xl font-bold text-gray-800">{stats.quizzesTaken.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Avg. Score</p>
          <p className="text-3xl font-bold text-gray-800">{stats.avgScore}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total Questions</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalQuestions.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Categories ── */}
      <h2 className="text-xl font-semibold mb-4">Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {categories.map((cat) => {
          const attempts = cat.attempts || cat.questionCount || 0
          const barWidth = Math.round((attempts / maxAttempts) * 100)
          return (
            <div key={cat._id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-800">{cat.name}</p>
                <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-full">
                  {cat.questionCount || 0}Q
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{attempts.toLocaleString()} attempts</p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Leaderboard ── */}
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-xs text-gray-400 uppercase font-semibold">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">Best Score</div>
          <div className="col-span-2 text-center">Quizzes</div>
          <div className="col-span-3">Accuracy</div>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No players yet</p>
        ) : (
          leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b items-center hover:bg-gray-50"
            >
              {/* Rank */}
              <div className="col-span-1 flex justify-center">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRankStyle(entry.rank)}`}>
                  {entry.rank}
                </span>
              </div>

              {/* User */}
              <div className="col-span-4 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {entry.initials}
                </div>
                <span className="font-medium text-gray-800 truncate text-sm">{entry.username}</span>
              </div>

              {/* Best Score */}
              <div className="col-span-2 text-center">
                <span className="text-purple-600 font-bold text-sm">{entry.bestScore}%</span>
              </div>

              {/* Quizzes */}
              <div className="col-span-2 text-center text-sm text-gray-500">
                {entry.quizzes}
              </div>

              {/* Accuracy bar */}
              <div className="col-span-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">accuracy</span>
                  <span className="text-xs font-semibold text-gray-600">{entry.accuracy}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getAccuracyColor(entry.accuracy)}`}
                    style={{ width: `${entry.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-gray-500 mt-20">Loading dashboard...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          renderDashboardContent()
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
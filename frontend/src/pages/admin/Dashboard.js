
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import Navbar from "../../components/Navbar"
import { jwtDecode } from "jwt-decode"


function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalCategories: 0,
    totalPlayers: 0,
    totalQuizzes: 0,
  })
  const [recentPlayers, setRecentPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")

      if (token) {
        const decodedToken = jwtDecode(token)
        console.log("Decoded Token:", decodedToken)
      }

      const response = await axios.get("http://localhost:5000/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setStats(response.data.stats)
      setRecentPlayers(response.data.recentPlayers)
    } catch (error) {
      setError("Failed to load dashboard data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  fetchDashboardData()
}, [])

  const handleNavigate = (path) => {
    navigate(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-600">Admin Dashboard</h1>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <h2 className="text-lg font-semibold mb-2">Total Questions</h2>
              <p className="text-3xl font-bold text-purple-600">{stats.totalQuestions}</p>
              <button
                onClick={() => handleNavigate("/admin/questions")}
                className="mt-3 text-sm text-purple-600 hover:underline"
              >
                Manage Questions
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h2 className="text-lg font-semibold mb-2">Categories</h2>
              <p className="text-3xl font-bold text-blue-600">{stats.totalCategories}</p>
              <button
                onClick={() => handleNavigate("/admin/questions")}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Manage Categories
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h2 className="text-lg font-semibold mb-2">Players</h2>
              <p className="text-3xl font-bold text-green-600">{stats.totalPlayers}</p>
              <button
                onClick={() => handleNavigate("/admin/players")}
                className="mt-3 text-sm text-green-600 hover:underline"
              >
                View Players
              </button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <h2 className="text-lg font-semibold mb-2">Quizzes Taken</h2>
              <p className="text-3xl font-bold text-yellow-600">{stats.totalQuizzes}</p>
              <button
                onClick={() => handleNavigate("/admin/leaderboard")}
                className="mt-3 text-sm text-yellow-600 hover:underline"
              >
                View Leaderboard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleNavigate("/admin/questions")}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
                >
                  <span>Manage Questions</span>
                </button>
                <button
                  onClick={() => handleNavigate("/admin/players")}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
                >
                  <span>Manage Players</span>
                </button>
                <button
                  onClick={() => handleNavigate("/admin/leaderboard")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
                >
                  <span>View Leaderboard</span>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Players</h2>
              {recentPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No recent player activity.</div>
              ) : (
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                        <th className="py-3 px-4 text-left">Player</th>
                        <th className="py-3 px-4 text-left">Last Quiz</th>
                        <th className="py-3 px-4 text-center">Score</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                      {recentPlayers.map((player) => (
                        <tr key={player._id} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="py-3 px-4 text-left whitespace-nowrap">{player.name}</td>
                          <td className="py-3 px-4 text-left">{new Date(player.lastQuizDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`py-1 px-2 rounded-full text-xs ${
                                player.lastScore >= 70
                                  ? "bg-green-200 text-green-700"
                                  : player.lastScore >= 40
                                    ? "bg-yellow-200 text-yellow-700"
                                    : "bg-red-200 text-red-700"
                              }`}
                            >
                              {player.lastScore}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

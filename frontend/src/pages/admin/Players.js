
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import Navbar from "../../components/Navbar"

function AdminPlayers() {
  const { user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:5000/api/admin/players", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setPlayers(response.data)
      } catch (error) {
        setError("Failed to load players")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  const handleViewPlayerDetails = async (playerId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/admin/players/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedPlayer(response.data)
      setIsModalOpen(true)
    } catch (error) {
      setError("Failed to load player details")
      console.error(error)
    }
  }

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/admin/players/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update players list
      setPlayers(players.filter((player) => player._id !== playerId))
    } catch (error) {
      setError("Failed to delete player")
      console.error(error)
    }
  }

  // Filter players based on search term
  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading players...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6 text-purple-600">Manage Players</h1>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
              Search Players
            </label>
            <input
              id="search"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No players found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Name</th>
                    <th className="py-3 px-6 text-left">Email</th>
                    <th className="py-3 px-6 text-center">Quizzes</th>
                    <th className="py-3 px-6 text-center">Avg. Score</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {filteredPlayers.map((player) => (
                    <tr key={player._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{player.name}</td>
                      <td className="py-3 px-6 text-left">{player.email}</td>
                      <td className="py-3 px-6 text-center">{player.quizzesTaken}</td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`py-1 px-3 rounded-full text-xs ${
                            player.averageScore >= 70
                              ? "bg-green-200 text-green-700"
                              : player.averageScore >= 40
                                ? "bg-yellow-200 text-yellow-700"
                                : "bg-red-200 text-red-700"
                          }`}
                        >
                          {player.averageScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center">
                          <button
                            onClick={() => handleViewPlayerDetails(player._id)}
                            className="transform hover:text-purple-500 hover:scale-110 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player._id)}
                            className="transform hover:text-red-500 hover:scale-110"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Player Details Modal */}
      {isModalOpen && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Player Details</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700">Basic Information</h3>
                <p>
                  <span className="font-medium">Name:</span> {selectedPlayer.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {selectedPlayer.email}
                </p>
                <p>
                  <span className="font-medium">Joined:</span> {new Date(selectedPlayer.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">Quiz Statistics</h3>
                <p>
                  <span className="font-medium">Quizzes Taken:</span> {selectedPlayer.quizzesTaken}
                </p>
                <p>
                  <span className="font-medium">Average Score:</span> {selectedPlayer.averageScore.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Best Score:</span> {selectedPlayer.bestScore}%
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-700 mb-2">Recent Quiz History</h3>
            {selectedPlayer.recentQuizzes.length === 0 ? (
              <p className="text-gray-500">No quiz history available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                      <th className="py-2 px-4 text-left">Date</th>
                      <th className="py-2 px-4 text-left">Category</th>
                      <th className="py-2 px-4 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {selectedPlayer.recentQuizzes.map((quiz) => (
                      <tr key={quiz._id} className="border-b border-gray-200">
                        <td className="py-2 px-4 text-left">{new Date(quiz.date).toLocaleDateString()}</td>
                        <td className="py-2 px-4 text-left">{quiz.categoryName}</td>
                        <td className="py-2 px-4 text-center">
                          <span
                            className={`py-1 px-2 rounded-full text-xs ${
                              quiz.scorePercentage >= 70
                                ? "bg-green-200 text-green-700"
                                : quiz.scorePercentage >= 40
                                  ? "bg-yellow-200 text-yellow-700"
                                  : "bg-red-200 text-red-700"
                            }`}
                          >
                            {quiz.scorePercentage}%
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
      )}
    </div>
  )
}

export default AdminPlayers

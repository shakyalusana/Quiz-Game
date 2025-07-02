import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../../components/Navbar'

function AdminLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')

        // Fetch categories
        const categoriesResponse = await axios.get(
          'http://localhost:5000/api/categories',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setCategories(categoriesResponse.data)

        // Fetch leaderboard
        const leaderboardResponse = await axios.get(
          'http://localhost:5000/api/admin/leaderboard',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setLeaderboard(leaderboardResponse.data)
      } catch (error) {
        setError('Failed to load leaderboard data')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter leaderboard based on category
  const filteredLeaderboard =
    selectedCategory === 'all'
      ? leaderboard
      : leaderboard.filter((entry) => entry.categoryId === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading leaderboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6 text-purple-600">
            Leaderboard
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="category-filter"
            >
              Filter by Category
            </label>
            <select
              id="category-filter"
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leaderboard data available for this category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-center">Rank</th>
                    <th className="py-3 px-6 text-left">Player</th>
                    <th className="py-3 px-6 text-center">Quizzes Taken</th>
                    <th className="py-3 px-6 text-center">Avg. Score</th>
                    <th className="py-3 px-6 text-center">Best Score</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {filteredLeaderboard.map((entry, index) => (
                    <tr
                      key={entry._id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        index < 3 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-3 px-6 text-center">
                        <div
                          className={`font-bold ${
                            index === 0
                              ? 'text-yellow-500'
                              : index === 1
                              ? 'text-gray-500'
                              : index === 2
                              ? 'text-amber-700'
                              : ''
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-left">
                        {entry.playerName}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {entry.quizzesTaken}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`py-1 px-3 rounded-full text-xs ${
                            entry.averageScore >= 70
                              ? 'bg-green-200 text-green-700'
                              : entry.averageScore >= 40
                              ? 'bg-yellow-200 text-yellow-700'
                              : 'bg-red-200 text-red-700'
                          }`}
                        >
                          {entry.averageScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        {entry.bestScore}%
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
  )
}

export default AdminLeaderboard

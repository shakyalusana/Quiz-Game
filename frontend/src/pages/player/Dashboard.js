import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../../utils/axiosConfig'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/Navbar'
import { toast } from 'react-toastify'

function PlayerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(10)
  const [maxQuestions, setMaxQuestions] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories')
        setCategories(response.data)
        if (response.data.length > 0) {
          setSelectedCategory(response.data[0]._id)
          // Fetch question count for first category
          fetchQuestionCount(response.data[0]._id)
        }
      } catch (error) {
        const message =
          error.response?.data?.message || 'Failed to load categories'
        setError(message)
        toast.error(message)
        console.error(error)
      }
    }

    fetchCategories()
  }, [user, navigate])

  const fetchQuestionCount = async (categoryId) => {
    try {
      const response = await axios.get(`/api/questions/count/${categoryId}`)
      setMaxQuestions((prev) => ({
        ...prev,
        [categoryId]: response.data.count || 0,
      }))
    } catch (error) {
      console.error('Failed to fetch question count:', error)
    }
  }

  const handleCategoryChange = (e) => {
    const newCategoryId = e.target.value
    setSelectedCategory(newCategoryId)
    if (!maxQuestions[newCategoryId]) {
      fetchQuestionCount(newCategoryId)
    }
  }

  const handleStartQuiz = () => {
    if (!selectedCategory) {
      toast.warning('Please select a category first')
      return
    }

    const availableQuestions = maxQuestions[selectedCategory] || 0
    if (questionCount > availableQuestions) {
      toast.warning(
        `Only ${availableQuestions} questions available in this category. Please select a lower number.`
      )
      return
    }

    navigate(
      `/player/quiz/${selectedCategory}?difficulty=${selectedDifficulty}&count=${questionCount}`
    )
  }

  const handleViewHistory = () => {
    navigate('/player/history')
  }

  const renderDashboardContent = () => (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-purple-600">
        Welcome, {user?.name}!
      </h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Start a New Quiz</h2>

        {/* Category Selection */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="category"
          >
            Select Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name} ({maxQuestions[category._id] || '...'} questions
                available)
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="difficulty"
          >
            Select Difficulty
          </label>
          <select
            id="difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Question Count Selection */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="questionCount"
          >
            Number of Questions
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="questionCount"
              min="5"
              max={maxQuestions[selectedCategory] || 20}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-700 font-medium w-12 text-center">
              {questionCount}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Available questions: {maxQuestions[selectedCategory] || '...'}
          </p>
        </div>

        <button
          onClick={handleStartQuiz}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full"
          disabled={!selectedCategory}
        >
          Start Quiz
        </button>
      </div>

      <div className="border-t pt-6">
        <button
          onClick={handleViewHistory}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          View My History
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {error ? (
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

export default PlayerDashboard

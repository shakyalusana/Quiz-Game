"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import Navbar from "../../components/Navbar"

function AdminQuestions() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // For adding/editing questions
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState({
    _id: "",
    text: "",
    options: ["", "", "", ""],
    correctOption: 0,
    categoryId: "",
  })

  // For adding categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  // For filtering
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")

        // Fetch categories
        const categoriesResponse = await axios.get("http://localhost:5000/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCategories(categoriesResponse.data)

        // Fetch questions
        const questionsResponse = await axios.get("http://localhost:5000/api/questions", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setQuestions(questionsResponse.data)
      } catch (error) {
        setError("Failed to load data")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddQuestion = () => {
    setIsEditMode(false)
    setCurrentQuestion({
      _id: "",
      text: "",
      options: ["", "", "", ""],
      correctOption: 0,
      categoryId: categories.length > 0 ? categories[0]._id : "",
    })
    setIsModalOpen(true)
  }

  const handleEditQuestion = (question) => {
    setIsEditMode(true)
    setCurrentQuestion({
      _id: question._id,
      text: question.text,
      options: [...question.options],
      correctOption: question.correctOption,
      categoryId: question.category._id,
    })
    setIsModalOpen(true)
  }

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update questions list
      setQuestions(questions.filter((q) => q._id !== questionId))
    } catch (error) {
      setError("Failed to delete question")
      console.error(error)
    }
  }

  const handleSaveQuestion = async () => {
    try {
      const token = localStorage.getItem("token")

      // Validate form
      if (!currentQuestion.text.trim()) {
        return setError("Question text is required")
      }

      if (currentQuestion.options.some((option) => !option.trim())) {
        return setError("All options must be filled")
      }

      if (!currentQuestion.categoryId) {
        return setError("Category is required")
      }

      if (isEditMode) {
        // Update existing question
        const response = await axios.put(
          `http://localhost:5000/api/questions/${currentQuestion._id}`,
          {
            text: currentQuestion.text,
            options: currentQuestion.options,
            correctOption: currentQuestion.correctOption,
            categoryId: currentQuestion.categoryId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        // Update questions list
        setQuestions(questions.map((q) => (q._id === currentQuestion._id ? response.data : q)))
      } else {
        // Add new question
        const response = await axios.post(
          "http://localhost:5000/api/questions",
          {
            text: currentQuestion.text,
            options: currentQuestion.options,
            correctOption: currentQuestion.correctOption,
            categoryId: currentQuestion.categoryId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        // Update questions list
        setQuestions([...questions, response.data])
      }

      // Close modal
      setIsModalOpen(false)
      setError("")
    } catch (error) {
      setError("Failed to save question")
      console.error(error)
    }
  }

  const handleAddCategory = async () => {
    try {
      if (!newCategory.trim()) {
        return setError("Category name is required")
      }

      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:5000/api/categories",
        {
          name: newCategory,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Update categories list
      setCategories([...categories, response.data])
      setNewCategory("")
      setIsCategoryModalOpen(false)
      setError("")
    } catch (error) {
      setError("Failed to add category")
      console.error(error)
    }
  }

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options]
    updatedOptions[index] = value
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    })
  }

  // Filter questions based on category and search term
  const filteredQuestions = questions.filter((question) => {
    const matchesCategory = selectedCategory === "all" || question.category._id === selectedCategory
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading questions...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">Manage Questions</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Category
              </button>
              <button
                onClick={handleAddQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Question
              </button>
            </div>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category-filter">
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

            <div className="md:w-2/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
                Search Questions
              </label>
              <input
                id="search"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Search by question text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No questions found. Add some questions to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Question</th>
                    <th className="py-3 px-6 text-left">Category</th>
                    <th className="py-3 px-6 text-center">Options</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {filteredQuestions.map((question) => (
                    <tr key={question._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">{question.text}</td>
                      <td className="py-3 px-6 text-left">{question.category.name}</td>
                      <td className="py-3 px-6 text-center">
                        <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">
                          {question.options.length} options
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="transform hover:text-purple-500 hover:scale-110 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question._id)}
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

      {/* Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{isEditMode ? "Edit Question" : "Add New Question"}</h2>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="question-text">
                Question Text
              </label>
              <textarea
                id="question-text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="3"
                value={currentQuestion.text}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                placeholder="Enter your question here..."
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Options</label>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`correct-${index}`}
                    name="correct-option"
                    checked={currentQuestion.correctOption === index}
                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctOption: index })}
                    className="mr-2"
                  />
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
              ))}
              <p className="text-sm text-gray-500 mt-1">Select the radio button next to the correct answer.</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={currentQuestion.categoryId}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, categoryId: e.target.value })}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setError("")
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category-name">
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false)
                  setNewCategory("")
                  setError("")
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminQuestions

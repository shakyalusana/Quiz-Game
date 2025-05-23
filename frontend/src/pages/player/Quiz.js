"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import Navbar from "../../components/Navbar"

function PlayerQuiz() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { categoryId, questionCount } = location.state || {}

  const [questions, setQuestions] = useState([])
  const [currentAnswers, setCurrentAnswers] = useState({})
  const [feedback, setFeedback] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!categoryId || !questionCount) {
      navigate("/player/dashboard")
      return
    }

    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://localhost:5000/api/questions/quiz`, {
          params: { categoryId, count: questionCount },
          headers: { Authorization: `Bearer ${token}` },
        })
        setQuestions(response.data)
      } catch (error) {
        setError("Failed to load questions")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [categoryId, questionCount, navigate])

  const handleAnswerSelect = (questionId, optionIndex) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))

    // Find the question
    const question = questions.find((q) => q._id === questionId)
    const isCorrect = question.correctOption === optionIndex

    // Set feedback
    setFeedback((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect,
        message: isCorrect ? "Correct!" : "Incorrect!",
      },
    }))

    // Update score
    if (isCorrect) {
      setScore((prev) => prev + 1)
    }
  }

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem("token")
      const answeredQuestions = Object.keys(currentAnswers).length

      if (answeredQuestions < questions.length) {
        if (
          !window.confirm(
            `You've only answered ${answeredQuestions} out of ${questions.length} questions. Are you sure you want to submit?`,
          )
        ) {
          return
        }
      }

      // Prepare results
      const results = questions.map((question) => ({
        questionId: question._id,
        selectedOption: currentAnswers[question._id] !== undefined ? currentAnswers[question._id] : null,
        isCorrect: currentAnswers[question._id] === question.correctOption,
      }))

      // Submit quiz results
      await axios.post(
        "http://localhost:5000/api/quiz/submit",
        {
          categoryId,
          results,
          score,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setQuizCompleted(true)
    } catch (error) {
      setError("Failed to submit quiz")
      console.error(error)
    }
  }

  const handleReturnToDashboard = () => {
    navigate("/player/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading quiz questions...</div>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-6 text-purple-600">Quiz Completed!</h1>
            <p className="text-xl mb-4">
              Your score: {score} out of {questions.length}
            </p>
            <p className="text-lg mb-6">
              {score === questions.length
                ? "Perfect score! Amazing job!"
                : score > questions.length / 2
                  ? "Good job! Keep practicing to improve."
                  : "Keep practicing to improve your score."}
            </p>
            <button
              onClick={handleReturnToDashboard}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">Quiz in Progress</h1>
            <div className="text-lg font-semibold">
              Score: {score} / {questions.length}
            </div>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <div className="space-y-8">
            {questions.map((question, questionIndex) => (
              <div key={question._id} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">
                  {questionIndex + 1}. {question.text}
                </h3>

                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      onClick={() => handleAnswerSelect(question._id, optionIndex)}
                      className={`p-3 rounded-md cursor-pointer border transition-colors ${
                        currentAnswers[question._id] === optionIndex
                          ? feedback[question._id]?.isCorrect
                            ? "bg-green-100 border-green-500"
                            : "bg-red-100 border-red-500"
                          : question.correctOption === optionIndex && feedback[question._id]
                            ? "bg-green-100 border-green-500"
                            : "hover:bg-gray-100 border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6">{String.fromCharCode(65 + optionIndex)}.</div>
                        <div className="ml-2">{option}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {feedback[question._id] && (
                  <div
                    className={`mt-2 text-sm ${feedback[question._id].isCorrect ? "text-green-600" : "text-red-600"}`}
                  >
                    {feedback[question._id].message}
                    {!feedback[question._id].isCorrect && (
                      <span className="block mt-1">
                        Correct answer: {String.fromCharCode(65 + question.correctOption)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmitQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerQuiz

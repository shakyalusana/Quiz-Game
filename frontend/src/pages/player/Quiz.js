import { useState, useEffect, useRef } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import axios from '../../utils/axiosConfig'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

// ✅ Internal Navbar Component (with disable logic)
function Navbar({ disableNav, timeLeft }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = (e, to) => {
    if (disableNav) {
      e.preventDefault()
      alert('You cannot navigate away during the quiz.')
    } else {
      navigate(to)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <nav className="bg-purple-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link
              to={
                user?.role === 'admin'
                  ? '/admin/dashboard'
                  : '/player/dashboard'
              }
              onClick={(e) =>
                handleNavClick(
                  e,
                  user?.role === 'admin'
                    ? '/admin/dashboard'
                    : '/player/dashboard'
                )
              }
              className="text-xl font-bold"
            >
              Quiz Game
            </Link>
          </div>

          {/* ⏲️ Timer visible during quiz */}
          {timeLeft !== null && (
            <div className="text-lg font-semibold tracking-wider">
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}

          {user && (
            <div className="flex items-center space-x-6">
              {user.role === 'player' ? (
                <>
                  <Link
                    to="/player/dashboard"
                    onClick={(e) => handleNavClick(e, '/player/dashboard')}
                    className="hover:text-purple-200"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/player/history"
                    onClick={(e) => handleNavClick(e, '/player/history')}
                    className="hover:text-purple-200"
                  >
                    My History
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={(e) => handleNavClick(e, '/admin/dashboard')}
                    className="hover:text-purple-200"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/questions"
                    onClick={(e) => handleNavClick(e, '/admin/questions')}
                    className="hover:text-purple-200"
                  >
                    Questions
                  </Link>
                  <Link
                    to="/admin/leaderboard"
                    onClick={(e) => handleNavClick(e, '/admin/leaderboard')}
                    className="hover:text-purple-200"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    to="/admin/players"
                    onClick={(e) => handleNavClick(e, '/admin/players')}
                    className="hover:text-purple-200"
                  >
                    Players
                  </Link>
                </>
              )}

              <div className="flex items-center space-x-2">
                <span className="text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-purple-800 hover:bg-purple-900 text-white text-sm py-1 px-3 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function Quiz() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()
  const difficulty = searchParams.get('difficulty') || 'medium'
  const count = parseInt(searchParams.get('count')) || 10
  const navigate = useNavigate()
  const { user } = useAuth()
  const mounted = useRef(true)

  const [questions, setQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [score, setScore] = useState(0)
  const [stats, setStats] = useState({
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  })

  // Set timer duration based on difficulty
  const getQuizDuration = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 120 // 2 minutes
      case 'medium':
        return 300 // 5 minutes
      case 'hard':
        return 540 // 9 minutes
      default:
        return 90 // fallback
    }
  }

  const [timeLeft, setTimeLeft] = useState(getQuizDuration(difficulty))

  // Reset timer if difficulty changes
  useEffect(() => {
    setTimeLeft(getQuizDuration(difficulty))
  }, [difficulty])

  // Keep latest handleSubmit ref to avoid stale closure inside timer
  const submitRef = useRef(null)

  useEffect(() => {
    submitRef.current = handleSubmit
  })

  // Cleanup flag
  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  // ⏲️ Start countdown when questions arrive
  useEffect(() => {
    if (loading) return // wait until loaded
    if (quizSubmitted) return // stop when submitted

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!quizSubmitted && submitRef.current) {
            setTimeUp(true)
            toast.info('Time is up! Submitting your quiz...')
            submitRef.current(true) // force submit
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, quizSubmitted])

  useEffect(() => {
    if (!categoryId || !user) {
      navigate('/player/dashboard')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.post(`/api/quiz/questions`, {
          categoryId,
          difficulty,
          count,
        })

        if (!mounted.current) return

        if (!response.data || response.data.length === 0) {
          throw new Error(
            'No questions available for this category and difficulty'
          )
        }

        setQuestions(response.data)
        setError('')
      } catch (err) {
        if (!mounted.current) return
        const message = err.response?.data?.message || err.message
        setError(message)
        toast.error(message)
        if (err.response?.status === 401) {
          navigate('/login')
        } else {
          navigate('/player/dashboard')
        }
      } finally {
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [categoryId, difficulty, count, navigate, user])

  const calculatePoints = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 1
      case 'medium':
        return 2
      case 'hard':
        return 3
      default:
        return 1
    }
  }

  const handleAnswer = (questionId, selectedOption) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }))
  }

  const handleSubmit = async (force = false) => {
    if (quizSubmitted) return // prevent double submit

    // Check if all questions are answered
    const unansweredCount = questions.length - Object.keys(userAnswers).length
    if (unansweredCount > 0 && !force) {
      toast.warning(
        `Please answer all questions. ${unansweredCount} remaining.`
      )
      return
    }

    try {
      // Calculate score and stats
      let totalScore = 0
      const newStats = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 },
      }

      const formattedAnswers = questions.map((question) => {
        let selectedOption = userAnswers[question._id]
        if (typeof selectedOption === 'undefined') selectedOption = null
        const isCorrect = selectedOption === question.correctOption
        const points = isCorrect ? calculatePoints(question.difficulty) : 0
        totalScore += points

        // Update stats
        newStats[question.difficulty].total += 1
        if (isCorrect) {
          newStats[question.difficulty].correct += 1
        }

        return {
          questionId: question._id,
          selectedOption,
          isCorrect,
          points,
          difficulty: question.difficulty,
        }
      })

      // Submit to backend
      await axios.post('/api/quiz/submit', {
        categoryId,
        answers: formattedAnswers,
        score: totalScore,
        stats: newStats,
      })

      setScore(totalScore)
      setStats(newStats)
      setQuizSubmitted(true)
      setTimeUp(false) // reset timeUp in case of manual submit
      toast.success('Quiz submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit quiz. Please try again.')
      console.error(error)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'hard':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getOptionStyle = (question, optionValue) => {
    if (!quizSubmitted) {
      return userAnswers[question._id] === optionValue
        ? 'bg-blue-100 border-blue-500'
        : 'hover:bg-gray-50'
    }

    // After submission
    const isCorrect = question.correctOption === optionValue
    const wasSelected = userAnswers[question._id] === optionValue

    if (isCorrect && wasSelected) {
      return 'bg-green-100 border-green-500' // Correct answer and user selected it
    }
    if (isCorrect) {
      return 'bg-green-100 border-green-500 ring-2 ring-green-500' // Correct answer but user didn't select it
    }
    if (wasSelected) {
      return 'bg-red-100 border-red-500' // User selected wrong answer
    }
    return 'opacity-50' // Neither correct nor selected
  }

  const getOptionLabel = (question, optionValue) => {
    if (!quizSubmitted) return null

    const isCorrect = question.correctOption === optionValue
    const wasSelected = userAnswers[question._id] === optionValue

    if (isCorrect && wasSelected) {
      return (
        <span className="ml-2 text-green-600 text-sm">✓ Correct answer</span>
      )
    }
    if (isCorrect) {
      return (
        <span className="ml-2 text-green-600 text-sm">✓ Correct answer</span>
      )
    }
    if (wasSelected) {
      return <span className="ml-2 text-red-600 text-sm">✗ Your answer</span>
    }
    return null
  }

  // Add this effect to auto-submit when all questions are answered
  useEffect(() => {
    if (!loading && !quizSubmitted && questions.length > 0) {
      const allAnswered = questions.every(
        (q) => userAnswers[q._id] !== undefined
      )
      if (allAnswered) {
        handleSubmit(true)
      }
    }
  }, [userAnswers, questions, loading, quizSubmitted])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar disableNav={true} timeLeft={null} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading questions...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar disableNav={true} timeLeft={null} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        disableNav={!quizSubmitted}
        timeLeft={quizSubmitted ? null : timeLeft}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Quiz - {questions[0]?.category?.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {count} Questions -{' '}
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}{' '}
                Difficulty
              </p>
            </div>
            <span className={`font-semibold ${getDifficultyColor(difficulty)}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>

          {quizSubmitted && timeUp && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-center font-semibold">
              Time's up! The quiz is over.
            </div>
          )}

          {quizSubmitted && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-bold mb-2">Quiz Results</h2>
              <p className="text-lg mb-2">Total Score: {score} points</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats).map(([diff, stat]) => (
                  <div
                    key={diff}
                    className={`p-3 rounded-lg ${
                      diff === 'easy'
                        ? 'bg-green-50'
                        : diff === 'medium'
                        ? 'bg-yellow-50'
                        : 'bg-red-50'
                    }`}
                  >
                    <p className={`font-medium ${getDifficultyColor(diff)}`}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </p>
                    <p className="text-sm">
                      {stat.correct}/{stat.total} correct (
                      {Math.round((stat.correct / stat.total) * 100) || 0}%)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question._id}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="text-lg font-medium">
                    {index + 1}. {question.text}
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${getDifficultyColor(
                      question.difficulty
                    )} bg-opacity-10`}
                  >
                    {question.difficulty.charAt(0).toUpperCase() +
                      question.difficulty.slice(1)}
                  </span>
                </div>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex items-center justify-between"
                    >
                      <button
                        onClick={() =>
                          !quizSubmitted && handleAnswer(question._id, option)
                        }
                        className={`flex-grow text-left p-3 border rounded-md transition-colors ${getOptionStyle(
                          question,
                          option
                        )}`}
                        disabled={quizSubmitted}
                      >
                        <span className="flex items-center justify-between">
                          <span>{option}</span>
                          {getOptionLabel(question, option)}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
                {quizSubmitted && (
                  <div className="mt-3 text-sm">
                    {userAnswers[question._id] === undefined ? (
                      <p className="text-yellow-600">
                        You did not answer this question. The correct answer
                        was: {question.correctOption}
                      </p>
                    ) : userAnswers[question._id] === question.correctOption ? (
                      <p className="text-green-600">
                        ✓ Correct! You earned{' '}
                        {calculatePoints(question.difficulty)} points
                      </p>
                    ) : (
                      <p className="text-red-600">
                        ✗ Incorrect. The correct answer was:{' '}
                        {question.correctOption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {quizSubmitted && (
            <div className="mt-6">
              <button
                onClick={() => navigate('/player/dashboard')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Quiz

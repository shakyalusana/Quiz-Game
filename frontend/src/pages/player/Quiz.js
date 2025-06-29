import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

// ✅ Internal Navbar Component (with disable logic)
function Navbar({ disableNav }) {
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

function PlayerQuiz() {
  const location = useLocation()
  const navigate = useNavigate()
  const { categoryId, questionCount } = location.state || {}

  const [questions, setQuestions] = useState([])
  const [currentAnswers, setCurrentAnswers] = useState({})
  const [error, setError] = useState('')
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!categoryId || !questionCount) {
      navigate('/player/dashboard', { replace: true })
      return
    }

    const fetchQuestions = async () => {
      if (fetchedRef.current) return
      fetchedRef.current = true

      try {
        const response = await axios.get(
          'http://localhost:5000/api/questions/quiz',
          {
            params: { categoryId, count: questionCount },
          }
        )

        const uniqueMap = new Map()
        response.data.forEach((q) => {
          if (!uniqueMap.has(q._id)) {
            uniqueMap.set(q._id, q)
          }
        })

        setQuestions(Array.from(uniqueMap.values()))
      } catch (err) {
        setError('Failed to load questions')
        console.error(err)
      }
    }

    fetchQuestions()

    window.history.pushState(null, '', window.location.href)
    const onPopState = () => {
      if (!quizCompleted) {
        window.history.pushState(null, '', window.location.href)
      }
    }
    const onBeforeUnload = (e) => {
      if (!quizCompleted) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [categoryId, questionCount, navigate, quizCompleted])

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (quizCompleted) return
    setCurrentAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
    const question = questions.find((q) => q._id === questionId)
    if (question && question.correctOption === optionIndex) {
      setScore((prev) => prev + 1)
    }
  }

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem('token')
      const results = questions.map((q) => ({
        questionId: q._id,
        selectedOption: currentAnswers[q._id] ?? null,
        isCorrect: currentAnswers[q._id] === q.correctOption,
      }))

      await axios.post(
        'http://localhost:5000/api/quiz/submit',
        { categoryId, results, score },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setQuizCompleted(true)
    } catch (err) {
      setError('Failed to submit quiz')
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar disableNav={!quizCompleted} />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">
              {quizCompleted ? 'Quiz Completed!' : 'Quiz in Progress'}
            </h1>
            <div className="text-lg font-semibold">
              Score: {score} / {questions.length}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {questions.map((q, i) => (
              <div key={q._id} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">
                  {i + 1}. {q.text}
                </h3>
                <div className="space-y-2">
                  {q.options.map((option, j) => {
                    const isSelected = currentAnswers[q._id] === j
                    const isCorrect = q.correctOption === j
                    const showCorrect =
                      quizCompleted &&
                      (isCorrect
                        ? 'bg-green-100 border-green-400'
                        : isSelected
                        ? 'bg-red-100 border-red-400'
                        : 'border-gray-300')

                    const classes = quizCompleted
                      ? `p-3 rounded-md border ${showCorrect}`
                      : `p-3 rounded-md cursor-pointer border transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border-blue-400'
                            : 'hover:bg-gray-100 border-gray-300'
                        }`

                    return (
                      <div
                        key={j}
                        onClick={() =>
                          !quizCompleted && handleAnswerSelect(q._id, j)
                        }
                        className={classes}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6">
                            {String.fromCharCode(65 + j)}.
                          </div>
                          <div className="ml-2">{option}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {quizCompleted && (
                  <p className="mt-2 text-sm text-gray-600">
                    Correct Answer:{' '}
                    <strong>
                      {String.fromCharCode(65 + q.correctOption)}.{' '}
                      {q.options[q.correctOption]}
                    </strong>
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            {!quizCompleted ? (
              <button
                onClick={handleSubmitQuiz}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => navigate('/player/dashboard')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerQuiz
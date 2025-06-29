import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PlayerDashboard from './pages/player/Dashboard'
import PlayerQuiz from './pages/player/Quiz'
import PlayerQuizReview from './pages/player/PlayerQuizReview'
import PlayerHistory from './pages/player/History'
import AdminDashboard from './pages/admin/Dashboard'
import AdminQuestions from './pages/admin/Questions'
import AdminLeaderboard from './pages/admin/Leaderboard'
import AdminPlayers from './pages/admin/Players'
import WelcomeQuiz from './pages/player/WelcomeQuiz'
import './index.css'

// Reusable ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'player' ? '/player/dashboard' : '/admin/dashboard'}
      />
    )
  }

  return children
}

const PlayerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['player']}>{children}</ProtectedRoute>
)
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Welcome quiz after login for players */}
          <Route
            path="/welcome-quiz"
            element={
              <PlayerRoute>
                <WelcomeQuiz />
              </PlayerRoute>
            }
          />

          {/* Player routes */}
          <Route
            path="/player/dashboard"
            element={
              <PlayerRoute>
                <PlayerDashboard />
              </PlayerRoute>
            }
          />
          <Route
            path="/player/quiz"
            element={
              <PlayerRoute>
                <PlayerQuiz />
              </PlayerRoute>
            }
          />
          <Route
            path="/player/quiz-review"
            element={
              <PlayerRoute>
                <PlayerQuizReview />
              </PlayerRoute>
            }
          />
          <Route
            path="/player/history"
            element={
              <PlayerRoute>
                <PlayerHistory />
              </PlayerRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <AdminRoute>
                <AdminQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/leaderboard"
            element={
              <AdminRoute>
                <AdminLeaderboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/players"
            element={
              <AdminRoute>
                <AdminPlayers />
              </AdminRoute>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
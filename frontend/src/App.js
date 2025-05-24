import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import PlayerDashboard from "./pages/player/Dashboard"
import PlayerQuiz from "./pages/player/Quiz"
import PlayerHistory from "./pages/player/History"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminQuestions from "./pages/admin/Questions"
import AdminLeaderboard from "./pages/admin/Leaderboard"
import AdminPlayers from "./pages/admin/Players"
import "./index.css"

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "player" ? "/player/dashboard" : "/admin/dashboard"} />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Player routes */}
          <Route
            path="/player/dashboard"
            element={
              <ProtectedRoute allowedRoles={["player"]}>
                <PlayerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/quiz"
            element={
              <ProtectedRoute allowedRoles={["player"]}>
                <PlayerQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/history"
            element={
              <ProtectedRoute allowedRoles={["player"]}>
                <PlayerHistory />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaderboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLeaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/players"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPlayers />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

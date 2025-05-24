
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="bg-purple-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to={user?.role === "admin" ? "/admin/dashboard" : "/player/dashboard"} className="text-xl font-bold">
              Quiz Game
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-6">
              {user.role === "player" ? (
                <>
                  <Link to="/player/dashboard" className="hover:text-purple-200">
                    Dashboard
                  </Link>
                  <Link to="/player/history" className="hover:text-purple-200">
                    My History
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/admin/dashboard" className="hover:text-purple-200">
                    Dashboard
                  </Link>
                  <Link to="/admin/questions" className="hover:text-purple-200">
                    Questions
                  </Link>
                  <Link to="/admin/leaderboard" className="hover:text-purple-200">
                    Leaderboard
                  </Link>
                  <Link to="/admin/players" className="hover:text-purple-200">
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

export default Navbar

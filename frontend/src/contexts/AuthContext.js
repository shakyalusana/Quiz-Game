

  import { createContext, useContext, useState, useEffect } from "react"
  import axios from "axios"

  const AuthContext = createContext()

  export function useAuth() {
    return useContext(AuthContext)
  }

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      // Check if user is already logged in
      const token = localStorage.getItem("token")
      if (token) {
        axios
          .get("http://localhost:5000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((response) => {
            setUser(response.data)
          })
          .catch(() => {
            localStorage.removeItem("token")
          })
          .finally(() => {
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    }, [])

    const login = async (email, password) => {
      try {
        const response = await axios.post("http://localhost:5000/api/auth/login", {
          email,
          password,
        })

        const { token, user } = response.data
        localStorage.setItem("token", token)
        setUser(user)
        return user
      } catch (error) {
        throw new Error(error.response?.data?.message || "Login failed")
      }
    }

    const signup = async (name, email, password, role) => {
      try {
        const response = await axios.post("http://localhost:5000/api/auth/signup", {
          name,
          email,
          password,
          role,
        })

        const { token, user } = response.data
        localStorage.setItem("token", token)
        setUser(user)
        return user
      } catch (error) {
        throw new Error(error.response?.data?.message || "Signup failed")
      }
    }

    const logout = () => {
      localStorage.removeItem("token")
      setUser(null)
    }

    const value = {
      user,
      login,
      signup,
      logout,
      loading,
    }

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
  }

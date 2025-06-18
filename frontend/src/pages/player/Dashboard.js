import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";

function PlayerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data);
        if (response.data.length > 0) {
          setSelectedCategory(response.data[0]._id);
        }
      } catch (error) {
        setError("Failed to load categories");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleStartQuiz = () => {
    navigate("/player/quiz", {
      state: {
        categoryId: selectedCategory,
        questionCount,
      },
    });
  };

  const handleViewHistory = () => {
    navigate("/player/history");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6 text-purple-600">
            Welcome, {user?.name}!
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Start a New Quiz</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                Select Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                disabled={loading}
              >
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="questionCount">
                Number of Questions: {questionCount}
              </label>
              <input
                id="questionCount"
                type="range"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>

            <button
              onClick={handleStartQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full"
              disabled={!selectedCategory || loading}
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
      </div>
    </div>
  );
}

export default PlayerDashboard;
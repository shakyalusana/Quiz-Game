import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";

function History() {
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestCategory: "",
    worstCategory: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please login again.");
          setLoading(false);
          return;
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log("Decoded token:", decodedToken);

        const response = await axios.get("http://localhost:5000/api/player/history", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-decoded-token": JSON.stringify(decodedToken)
          },
        });

        setQuizHistory(response.data.history);
        setStats({
          totalQuizzes: response.data.stats.totalQuizzes ?? 0,
          averageScore: response.data.stats.averageScore ?? 0,
          bestCategory: response.data.stats.bestCategory || "",
          worstCategory: response.data.stats.worstCategory || "",
        });
      } catch (error) {
        setError("Failed to load history");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleBackToDashboard = () => {
    navigate("/player/dashboard");
  };

  const getTotalQuestions = (quiz) => {
    return quiz.totalQuestions || quiz.questions?.length || 0;
  };

  const getValidScore = (quiz) => {
    const total = getTotalQuestions(quiz);
    return Math.min(quiz.score, total);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">Quiz History</h1>
            <button
              onClick={handleBackToDashboard}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Statistics</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Total Quizzes:</span> {stats.totalQuizzes}</p>
                <p><span className="font-medium">Average Score:</span> {stats.averageScore != null ? stats.averageScore.toFixed(2) : "0.00"}%</p>
                <p><span className="font-medium">Best Category:</span> {stats.bestCategory || "N/A"}</p>
                <p><span className="font-medium">Worst Category:</span> {stats.worstCategory || "N/A"}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Recent Quizzes</h2>

          {quizHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">You haven't taken any quizzes yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Category</th>
                    <th className="py-3 px-6 text-center">Questions</th>
                    <th className="py-3 px-6 text-center">Score</th>
                    <th className="py-3 px-6 text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {quizHistory.map((quiz) => {
                    const totalQuestions = getTotalQuestions(quiz);
                    const validScore = getValidScore(quiz);
                    const percentage = totalQuestions > 0 ? (validScore / totalQuestions) * 100 : 0;

                    return (
                      <tr key={quiz._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left">{quiz.category?.name || "N/A"}</td>
                        <td className="py-3 px-6 text-center">{totalQuestions}</td>
                        <td className="py-3 px-6 text-center">{validScore} / {totalQuestions}</td>
                        <td className="py-3 px-6 text-center">
                          <span
                            className={`py-1 px-3 rounded-full text-xs ${
                              percentage >= 70
                                ? "bg-green-200 text-green-700"
                                : percentage >= 40
                                ? "bg-yellow-200 text-yellow-700"
                                : "bg-red-200 text-red-700"
                            }`}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;

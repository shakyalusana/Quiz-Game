import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";

function PlayerQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, questionCount } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let fetched = false;

    if (!categoryId || !questionCount) {
      navigate("/player/dashboard", { replace: true });
      return;
    }

    const fetchQuestions = async () => {
      if (fetched) return;
      fetched = true;

      try {
        const response = await axios.get("http://localhost:5000/api/questions/quiz", {
          params: { categoryId, count: questionCount },
        });

        // ✅ Remove duplicates before setting
        const uniqueMap = new Map();
        response.data.forEach((q) => {
          if (!uniqueMap.has(q._id)) {
            uniqueMap.set(q._id, q);
          }
        });
        setQuestions(Array.from(uniqueMap.values()));
      } catch (err) {
        setError("Failed to load questions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();

    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      if (!quizCompleted) {
        window.history.pushState(null, "", window.location.href);
      }
    };
    const onBeforeUnload = (e) => {
      if (!quizCompleted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [categoryId, questionCount, navigate, quizCompleted]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (quizCompleted) return;
    setCurrentAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    const question = questions.find((q) => q._id === questionId);
    if (question && question.correctOption === optionIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const results = questions.map((q) => ({
        questionId: q._id,
        selectedOption: currentAnswers[q._id] ?? null,
        isCorrect: currentAnswers[q._id] === q.correctOption,
      }));

      await axios.post(
        "http://localhost:5000/api/quiz/submit",
        { categoryId, results, score },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuizCompleted(true);
    } catch (err) {
      setError("Failed to submit quiz");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          Loading quiz questions...
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-6 text-purple-600">Quiz Completed!</h1>
          <p className="text-xl mb-4">
            Your score: {score} out of {questions.length}
          </p>
          <button
            onClick={() => navigate("/player/dashboard")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
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
                    const isSelected = currentAnswers[q._id] === j;
                    return (
                      <div
                        key={j}
                        onClick={() => handleAnswerSelect(q._id, j)}
                        className={`p-3 rounded-md cursor-pointer border transition-colors ${
                          isSelected
                            ? "bg-blue-100 border-blue-400"
                            : "hover:bg-gray-100 border-gray-300"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6">
                            {String.fromCharCode(65 + j)}.
                          </div>
                          <div className="ml-2">{option}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmitQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerQuiz;
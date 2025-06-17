import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

function PlayerQuizReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, currentAnswers, score } = location.state || {};

  const handleReturnToDashboard = () => {
    navigate("/player/dashboard");
  };

  if (!questions || !currentAnswers) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center py-10">Invalid data. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">Quiz Review</h1>
            <div className="text-lg font-semibold">
              Score: {score} / {questions.length}
            </div>
          </div>

          <div className="space-y-8">
            {questions.map((question, questionIndex) => (
              <div key={question._id} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">
                  {questionIndex + 1}. {question.text}
                </h3>

                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = currentAnswers[question._id] === optionIndex;
                    const isCorrect = question.correctOption === optionIndex;

                    let borderClass = "border-gray-300";
                    let bgClass = "";

                    if (isSelected && isCorrect) {
                      bgClass = "bg-green-100";
                      borderClass = "border-green-500";
                    } else if (isSelected && !isCorrect) {
                      bgClass = "bg-red-100";
                      borderClass = "border-red-500";
                    } else if (!isSelected && isCorrect) {
                      bgClass = "bg-green-50";
                      borderClass = "border-green-400";
                    }

                    return (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-md border ${bgClass} ${borderClass}`}
                      >
                        <div className="flex items-start">
                          <div className="w-6 font-bold">
                            {String.fromCharCode(65 + optionIndex)}.
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
              onClick={handleReturnToDashboard}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerQuizReview;

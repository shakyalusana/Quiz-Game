import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../../components/Navbar"
import {jwtDecode} from 'jwt-decode'

function AdminQuestions() {
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // For adding/editing questions
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState({
    _id: "",
    text: "",
    options: ["", "", "", ""],
    correctOption: 0,
    categoryId: "",
  })

  // For adding categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  // For filtering
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")

      const categoriesResponse = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCategories(categoriesResponse.data)

      const questionsResponse = await axios.get("http://localhost:5000/api/questions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setQuestions(questionsResponse.data)

      console.log("Categories:", categoriesResponse.data)
      console.log("Questions:", questionsResponse.data)
    } catch (error) {
      setError("Failed to load data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [])


  const handleAddQuestion = () => {
    setIsEditMode(false)
    setCurrentQuestion({
      _id: "",
      text: "",
      options: ["", "", "", ""],
      correctOption: 0,
      categoryId: categories.length > 0 ? categories[0]._id : "",
    })
    setIsModalOpen(true)
  }

const handleEditQuestion = async (questionId) => {
  try {
    const token = localStorage.getItem("token");

    // Fetch the full question data from backend using the question ID
    const response = await axios.get(
      `http://localhost:5000/api/questions/${questionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const question = response.data;

    // Set the state to open modal and load question data for editing
    setIsEditMode(true);
    setCurrentQuestion({
      _id: question._id,
      text: question.text,
      options: [...question.options],
      correctOption: question.correctOption,
      categoryId: question.category._id || question.category,
    });
    setIsModalOpen(true);
    setError("");
  } catch (error) {
    console.error("Failed to fetch question data for editing:", error);
    setError("Failed to load question data for editing");
  }
};




  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update questions list
      setQuestions(questions.filter((q) => q._id !== questionId))
    } catch (error) {
      setError("Failed to delete question")
      console.error(error)
    }
  }

const handleSaveQuestion = async () => {
  try {
    const token = localStorage.getItem("token");
    const decode = jwtDecode(token);
    console.log(decode);

    // Validate question text
    if (!currentQuestion.text || !currentQuestion.text.trim()) {
      return setError("Question text is required");
    }

    // Validate options
    if (
      !Array.isArray(currentQuestion.options) ||
      currentQuestion.options.length < 2 ||
      currentQuestion.options.some((opt) => !opt || !opt.trim())
    ) {
      return setError("All options must be filled and at least 2 options required");
    }

    // Validate categoryId (must be 24 hex chars)
    if (!currentQuestion.categoryId || !/^[a-fA-F0-9]{24}$/.test(currentQuestion.categoryId)) {
      return setError("Valid category is required");
    }

    // Validate correctOption
    if (
      currentQuestion.correctOption === undefined ||
      currentQuestion.correctOption === null ||
      typeof currentQuestion.correctOption !== "number" ||
      currentQuestion.correctOption < 0 ||
      currentQuestion.correctOption >= currentQuestion.options.length
    ) {
      return setError("Please select a valid correct option");
    }

    // If editing, validate that the question actually exists in the list
    if (isEditMode) {
      const exists = questions.some(q => q._id === currentQuestion._id);
      if (!exists) {
        return setError("Cannot edit: Question not found.");
      }
    }

    // Prepare payload using the updated field names
    const payload = {
      text: currentQuestion.text.trim(),
      options: currentQuestion.options.map((opt) => opt.trim()),
      categoryId: currentQuestion.categoryId,
      correctOption: currentQuestion.correctOption,
    };

    let response;
    if (isEditMode) {
      response = await axios.put(
        `http://localhost:5000/api/questions/${currentQuestion._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestions(
        questions.map((q) => (q._id === currentQuestion._id ? response.data : q))
      );
    } else {
      response = await axios.post(
        "http://localhost:5000/api/questions/",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestions([...questions, response.data]);
    }

    setIsModalOpen(false);
    setError("");
  } catch (error) {
    setError("Failed to save question");
    console.error("Error saving question:", error);
    console.error("Response:", error?.response?.data);
  }
};

const resolveCategoryName = (category) => {
  if (!category) return "Unknown Category";

  // If category is an object with a name property, return the name directly
  if (typeof category === "object" && category.name) {
    return category.name;
  }

  // Otherwise, category is expected to be an ID string
  const cat = categories.find((cat) => cat._id === category);
  return cat ? cat.name : "Unknown Category";
};
  const handleAddCategory = async () => {
    try {
      if (!newCategory.trim()) {
        return setError("Category name is required");
      }
      // Check for duplicate category name (case-insensitive)
      if (categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
        return setError("Category already exists");
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/categories",
        {
          name: newCategory,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Update categories list
      setCategories([...categories, response.data])
      setNewCategory("")
      setIsCategoryModalOpen(false)
      setError("")
    } catch (error) {
      setError("Failed to add category")
      console.error(error)
    }
  }

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options]
    updatedOptions[index] = value
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    })
  }
  

  // Filter questions based on category and search term
  const filteredQuestions = questions.filter((question) => {
  // If "all" is selected, show all questions
  if (selectedCategory === "all") return true;

  // Find the category object from categories list
  const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
  if (!selectedCategoryObj) return false; // if not found, exclude question

  const selectedCategoryName = selectedCategoryObj.name;

  // Get the question's category name (handle populated or id)
  let questionCategoryName = "Unknown Category";
  if (typeof question.category === "object" && question.category !== null && question.category.name) {
    questionCategoryName = question.category.name;
  } else if (typeof question.category === "string") {
    const cat = categories.find(cat => cat._id === question.category);
    questionCategoryName = cat ? cat.name : "Unknown Category";
  }

  const matchesCategory = questionCategoryName === selectedCategoryName;
  const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase());

  return matchesCategory && matchesSearch;
});



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading questions...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">Manage Questions</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Category
              </button>
              <button
                onClick={handleAddQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Question
              </button>
            </div>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category-filter">
                Filter by Category
              </label>
              <select
                id="category-filter"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:w-2/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
                Search Questions
              </label>
              <input
                id="search"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Search by question text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No questions found. Add some questions to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Question</th>
                    <th className="py-3 px-6 text-left">Category</th>
                    <th className="py-3 px-6 text-center">Options</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {filteredQuestions.map((question) => (
                    <tr key={question._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">{question.text}</td>
                      <td className="py-3 px-6 text-left">
                        {resolveCategoryName(question.category)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">
                          {question.options.length} options
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center">
                          <button
  onClick={() => handleEditQuestion(question._id)}
  className="transform hover:text-purple-500 hover:scale-110 mr-3"
>
  Edit
</button>

                          <button
                            onClick={() => handleDeleteQuestion(question._id)}
                            className="transform hover:text-red-500 hover:scale-110"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">{isEditMode ? "Edit Question" : "Add Question"}</h2>

            <label className="block text-gray-700 mb-2 font-semibold" htmlFor="question-text">
              Question Text
            </label>
            <textarea
              id="question-text"
              className="w-full border border-gray-300 rounded p-2 mb-4"
              rows={3}
              value={currentQuestion.text}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
            />

            <label className="block text-gray-700 mb-2 font-semibold" htmlFor="category-select">
              Category
            </label>
            <select
              id="category-select"
              className="w-full border border-gray-300 rounded p-2 mb-4"
              value={currentQuestion.categoryId}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, categoryId: e.target.value })}
            >
              <option value="" disabled>
                Select Category
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">Options</label>
              {currentQuestion.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  className="w-full border border-gray-300 rounded p-2 mb-2"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">Correct Option</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={currentQuestion.correctOption}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, correctOption: parseInt(e.target.value, 10) })
                }
              >
                {currentQuestion.options.map((_, index) => (
                  <option key={index} value={index}>
                    Option {index + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>

            <input
              type="text"
              placeholder="Category name"
              className="w-full border border-gray-300 rounded p-2 mb-4"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminQuestions

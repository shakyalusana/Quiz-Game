

//! Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

//! Get random questions from a category
function getRandomQuestions(questions, count) {
  //! Shuffle the questions array
  const shuffled = shuffleArray(questions)

  //! Return the requested number of questions
  return shuffled.slice(0, count)
}

//! Get random questions with difficulty distribution
function getRandomQuestionsWithDifficulty(
  questions,
  count,
  difficultyDistribution = { easy: 0.3, medium: 0.5, hard: 0.2 },
) {

  //! Group questions by difficulty
  const questionsByDifficulty = {
    easy: questions.filter((q) => q.difficulty === "easy"),
    medium: questions.filter((q) => q.difficulty === "medium"),
    hard: questions.filter((q) => q.difficulty === "hard"),
  }

  //! Calculate number of questions for each difficulty
  const easyCount = Math.round(count * difficultyDistribution.easy)
  const mediumCount = Math.round(count * difficultyDistribution.medium)
  const hardCount = count - easyCount - mediumCount

  //! Get random questions for each difficulty
  const easyQuestions = getRandomQuestions(questionsByDifficulty.easy, easyCount)
  const mediumQuestions = getRandomQuestions(questionsByDifficulty.medium, mediumCount)
  const hardQuestions = getRandomQuestions(questionsByDifficulty.hard, hardCount)

  //! Combine and shuffle the questions
  return shuffleArray([...easyQuestions, ...mediumQuestions, ...hardQuestions])
}

module.exports = {
  shuffleArray,
  getRandomQuestions,
  getRandomQuestionsWithDifficulty,
}

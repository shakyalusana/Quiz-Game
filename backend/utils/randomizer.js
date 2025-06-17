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

module.exports = {
  shuffleArray,
  getRandomQuestions,
  getRandomQuestionsWithDifficulty,
}

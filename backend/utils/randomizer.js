//! Fisher-Yates shuffle algorithm with validation and step-by-step processing
function shuffleArray(array) {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array.')
  }

  if (array.length === 0) {
    throw new Error('Array cannot be empty.')
  }

  const shuffled = [...array] // Create a shallow copy to preserve the original array

  // Internal swap function for clarity
  const swap = (arr, i, j) => {
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomIndex(i)
    swap(shuffled, i, j)
    // console.log(`Swapped index ${i} with index ${j}`) // Optional: Debugging step-by-step
  }

  return shuffled
}

//! Generate a random index for swapping
function getRandomIndex(max) {
  if (typeof max !== 'number' || max < 0) {
    throw new Error('Max must be a non-negative number.')
  }
  return Math.floor(Math.random() * (max + 1))
}

//! Get random questions from a category with input validation
function getRandomQuestions(questions, count) {
  if (!Array.isArray(questions)) {
    throw new Error('Questions must be an array.')
  }

  if (typeof count !== 'number' || count <= 0) {
    throw new Error('Count must be a positive number.')
  }

  if (count > questions.length) {
    throw new Error('Requested count exceeds available questions.')
  }

  //! Shuffle the questions array
  const shuffled = shuffleArray(questions)

  //! Return the requested number of questions
  return shuffled.slice(0, count)
}

module.exports = {
  shuffleArray,
  getRandomQuestions,
}


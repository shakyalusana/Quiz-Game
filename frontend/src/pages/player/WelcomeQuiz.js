import React from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

function WelcomeQuiz() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/player/dashboard') 
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-4xl font-bold text-purple-700 mb-6">
          Welcome to the Quiz Game!
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Get ready to test your knowledge. Click below to start.
        </p>
        <button
          onClick={handleStart}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded"
        >
          Start Quiz
        </button>
      </div>
    </div>
  )
}

export default WelcomeQuiz
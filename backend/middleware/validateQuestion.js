const { body, validationResult } = require('express-validator')
const mongoose = require('mongoose')

const validateQuestion = [
  // Validate question text
  body('text').trim().notEmpty().withMessage('Question text is required'),

  // Validate options array
  body('options')
    .isArray({ min: 2 })
    .withMessage('At least 2 options are required')
    .custom((options) =>
      options.every((opt) => typeof opt === 'string' && opt.trim().length > 0)
    )
    .withMessage('Each option must be a non-empty string'),

  // Validate correct option index
  body('correctOption')
    .isInt({ min: 0 })
    .withMessage('Correct option must be a valid index')
    .custom((value, { req }) => {
      const options = req.body.options
      return Array.isArray(options) && value >= 0 && value < options.length
    })
    .withMessage('Correct option index must be within options range'),

  // Validate category
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid category ID format'),

  // Validate difficulty
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be either easy, medium, or hard'),

  // Check for validation errors
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  },
]

module.exports = validateQuestion

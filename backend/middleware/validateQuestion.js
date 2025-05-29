const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const validateQuestion = require('./path/to/validateQuestion');

router.post("/questions", validateQuestion, yourCreateHandler);

const validateQuestion = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Question text is required")
    .custom((text) => {
      // Must start with a capital letter and end with a question mark
      return /^[A-Z][\s\S]*\?\s*$/.test(text);
    })
    .withMessage("Question must start with a capital letter and end with a question mark"),

  body("options")
    .isArray({ min: 2 })
    .withMessage("Options must be an array with at least 2 items")
    .custom((opts) => opts.every(opt => typeof opt === "string" && opt.trim().length > 0))
    .withMessage("Each option must be a non-empty string"),

  body("correctOption")
    .notEmpty()
    .withMessage("Correct option is required")
    .custom((value, { req }) => {
      if (!Array.isArray(req.body.options)) return false;
      return req.body.options.includes(value);
    })
    .withMessage("Correct option must be one of the provided options"),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid category ID"),
];

import { body } from "express-validator";

// Validation middleware
const validateTask = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title is required and must be between 1-200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("category")
    .isIn([
      "Arts and craft",
      "nature",
      "family",
      "Sport",
      "friends",
      "meditation",
    ])
    .withMessage("Invalid category selected"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),

  body("wheelWeight")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Wheel weight must be between 1 and 10"),

  body("isWheelEligible")
    .optional()
    .isBoolean()
    .withMessage("Wheel eligibility must be true or false"),
];
export default validateTask;

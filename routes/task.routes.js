import express from "express";
import passport from "passport";
import {
  createTask,
  getAllTask,
  getSingleTask,
  updateTask,
  updateStatus,
  deleteTask,
} from "../controller/task.controller.js";
import validateTask from "../middleware/validation.middleware.js";
import { param } from "express-validator";

// set up express router
const router = express.Router();

// create a route for the signup page
router.post(
  "/create",
  validateTask,
  passport.authenticate("jwt", { session: false }),
  createTask
);
router.get(
  "/get/all/task",
  passport.authenticate("jwt", { session: false }),
  getAllTask
);
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID format")],
  passport.authenticate("jwt", { session: false }),
  getSingleTask
);
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID format"),
    ...validateTask,
  ],
  passport.authenticate("jwt", { session: false }),
  updateTask
);
router.patch(
  "/:id/status",
  [param("id").isMongoId().withMessage("Invalid task ID format")],
  passport.authenticate("jwt", { session: false }),
  updateStatus
);
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID format")],
  passport.authenticate("jwt", { session: false }),
  deleteTask
);
// export the router
export default router;

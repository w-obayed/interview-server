import expressAsyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import Task from "../model/task.model.js";

/**
 * @description create task
 * @method POST
 * @route /api/v1/task/create
 * @access public
 */
export const createTask = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  const { title, category } = req.body;

  // Validate input
  if (!category || !title) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required!" });
  }

  // user
  const user = req.user;

  // check user
  if (!user) {
    return res.status(400).json({ success: false, message: "user invalid!" });
  }

  // Here you would typically save the task to the database
  const task = await Task.create({
    title,
    description: req.body.description || null,
    category,
    status: req.body.status || "pending",
    createdBy: user._id,
  });

  // For demonstration, we will just return a success message
  res.status(201).json({
    task,
    success: true,
    message: "Task created successfully!",
  });
});
/**
 * @description get all task
 * @method GET
 * @route /api/v1/task/get/all/task
 * @access public
 */
export const getAllTask = expressAsyncHandler(async (req, res) => {
  // user
  const user = req.user;

  // check user
  if (!user) {
    return res.status(400).json({ success: false, message: "user invalid!" });
  }

  // Query parameters for filtering and pagination
  const {
    status,
    category,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter object
  const filter = { createdBy: user._id };

  if (status) filter.status = status;
  if (category) filter.category = category;

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 per page
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = order === "asc" ? 1 : -1;

  // Execute query
  const [tasks, totalTasks] = await Promise.all([
    Task.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    Task.countDocuments(filter),
  ]);

  // Add computed fields
  const tasksWithComputedFields = tasks.map((task) => ({
    ...task,
    isOverdue:
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "done",
    daysUntilDue: task.dueDate
      ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  }));

  const totalPages = Math.ceil(totalTasks / limitNum);

  res.status(200).json({
    success: true,
    tasks: tasksWithComputedFields,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalTasks,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
    filters: {
      status,
      category,
    },
  });
});

/**
 * @description get single task
 * @method GET
 * @route /api/v1/task/:id
 * @access public
 */
export const getSingleTask = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  // user
  const user = req.user;

  // check user
  if (!user) {
    return res.status(400).json({ success: false, message: "user invalid!" });
  }

  const { id } = req.params;

  const task = await Task.findOne({
    _id: id,
    createdBy: user.id,
  }).populate("createdBy", "email name");

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Add computed fields
  const taskWithComputedFields = {
    ...task.toObject(),
    isOverdue:
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "done",
    daysUntilDue: task.dueDate
      ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  };

  res.status(200).json({
    success: true,
    task: taskWithComputedFields,
  });
});

/**
 * @description update task
 * @method PUT
 * @route /api/v1/task/:id
 * @access public
 */
export const updateTask = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  // user
  const user = req.user;

  // check user
  if (!user) {
    return res.status(400).json({ success: false, message: "user invalid!" });
  }

  const { id } = req.params;
  const {
    title,
    description,
    category,
    status,
    dueDate,
    isWheelEligible,
    wheelWeight,
  } = req.body;

  // Find and verify ownership
  const existingTask = await Task.findOne({
    _id: id,
    createdBy: user.id,
  });

  if (!existingTask) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Prepare update data
  const updateData = {
    title: title?.trim(),
    description: description?.trim(),
    category,
    status,
    dueDate: dueDate ? new Date(dueDate) : null,
    isWheelEligible,
    wheelWeight,
  };

  // Handle status change to 'done'
  if (status === "done" && existingTask.status !== "done") {
    updateData.isCompleted = true;
    updateData.completedAt = new Date();
  } else if (status !== "done" && existingTask.status === "done") {
    updateData.isCompleted = false;
    updateData.completedAt = null;
  }

  const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    task: updatedTask,
  });
});

/**
 * @description update status
 * @method PATCH
 * @route /api/v1/task/:id/status
 * @access public
 */
export const updateStatus = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  // user
  const user = req.user;

  // check user
  if (!user) {
    return res.status(400).json({ success: false, message: "user invalid!" });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "ongoing", "collaborate task", "done"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value",
    });
  }

  // Find and verify ownership
  const task = await Task.findOne({
    _id: id,
    createdBy: user.id,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Update status and related fields
  const updateData = { status };

  // Handle status change to 'done'
  if (status === "done" && task.status !== "done") {
    updateData.isCompleted = true;
    updateData.completedAt = new Date();
  } else if (status !== "done" && task.status === "done") {
    updateData.isCompleted = false;
    updateData.completedAt = null;
  }

  const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: `Task status updated to ${status}`,
    task: updatedTask,
  });
});

/**
 * @description delete task
 * @method DELETE
 * @route /api/v1/task/:id/
 * @access public
 */
export const deleteTask = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  // user
  const user = req.user;

  // check user
  if (!user) {
    return res.status(400).json({ success: false, message: "user invalid!" });
  }

  const { id } = req.params;

  // Find and verify ownership
  const deletedTask = await Task.findByIdAndDelete({
    _id: id,
    createdBy: user.id,
  });

  if (!deletedTask) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

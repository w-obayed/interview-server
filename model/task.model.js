import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: null,
    },
    category: {
      type: String,
      enum: {
        values: [
          "Arts and craft",
          "nature",
          "family",
          "Sport",
          "friends",
          "meditation",
        ],
        message:
          "Category must be one of: Arts and craft, nature, family, Sport, friends, meditation",
      },
      required: [true, "Category is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["ongoing", "pending", "collaborate task", "done"],
        message:
          "Status must be one of: ongoing, pending, collaborate task, done",
      },
      default: "pending",
    },
    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          // Only validate if dueDate is provided
          if (value) {
            return value >= new Date();
          }
          return true;
        },
        message: "Due date cannot be in the past",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
      validate: {
        validator: function (value) {
          return mongoose.Types.ObjectId.isValid(value);
        },
        message: "Invalid user ID",
      },
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isWheelEligible: {
      type: Boolean,
      default: true,
    },
    wheelWeight: {
      type: Number,
      min: [1, "Wheel weight must be at least 1"],
      max: [10, "Wheel weight cannot exceed 10"],
      default: 5,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for checking if task is overdue
taskSchema.virtual("isOverdue").get(function () {
  return this.dueDate && this.dueDate < new Date() && !this.isCompleted;
});

// Pre-save middleware to set completedAt when task is marked as done
taskSchema.pre("save", function (next) {
  if (this.status === "done" && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  } else if (this.status !== "done" && this.isCompleted) {
    this.isCompleted = false;
    this.completedAt = null;
  }
  next();
});

// Add indexes for better query performance
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isWheelEligible: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;

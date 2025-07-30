import mongoose from "mongoose";
import color from "colors";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected".bgBlue.white.bold);
  } catch (error) {
    console.error("MongoDB connection error:", error.message.bgRed.white.bold);
    process.exit(1);
  }
};

export default connectDB;

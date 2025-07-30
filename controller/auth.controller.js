import expressAsyncHandler from "express-async-handler";
import { generateOTP, isEmailValid, randStr } from "../helper/helper.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import User from "../model/user.model.js";
import sendMail from "../config/mail.config.js";
import { validationResult } from "express-validator";

/**
 * @description create user
 * @method POST
 * @route /api/v1/auth/signup
 * @access public
 */
export const signup = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required!" });
  }

  // email validation
  if (!isEmailValid(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Email is not valid!" });
  }

  // Check if the email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res
      .status(400)
      .json({ success: false, message: "Email already exists!" });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long!",
    });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);

  // create verificationToken
  const verificationToken = generateOTP();
  const verificationTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Here you would typically save the user to the database
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    verificationToken,
    verificationTokenExpiry,
  });

  // password is hashed and user is created
  newUser.password = undefined; // Remove password from the response

  // create options for sending verification email
  const options = {
    email: newUser.email,
    subject: "Verify your email!",
    html: `Your verification code is <strong>${verificationToken}</strong>. It is valid for 10 minutes!`,
  };

  // send verification email
  await sendMail(options).catch((error) => {
    console.error("Error sending verification email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification email!",
    });
  });

  // For demonstration, we will just return a success message
  res.status(201).json({
    success: true,
    message: "User created successfully!",
    user: newUser,
  });
});

/**
 * @description verify email
 * @method POST
 * @route /api/v1/auth/verify/email
 * @access public
 */
export const verifyEmail = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  const { verificationToken } = req.body;

  // Validate input
  if (!verificationToken) {
    return res
      .status(400)
      .json({ success: false, message: "Verification token is required!" });
  }

  // Find user by verification token
  const user = await User.findOne({
    verificationToken,
    verificationTokenExpiry: { $gt: Date.now() }, // Check if token is still valid
  });

  // If user not found or token expired
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification token!",
    });
  }

  // Update user's email verification status
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  // create options for sending verification success email
  const options = {
    email: user.email,
    subject: "Email Verified Successfully!",
    html: `<p>Your email has been successfully verified!</p>`,
  };

  // send verification success email
  await sendMail(options).catch((error) => {
    console.error("Error sending verification success email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification success email!",
    });
  });

  // Respond with success message
  res.status(200).json({
    success: true,
    message: "Email verified successfully!",
  });
});

/**
 * @description login user
 * @method POST
 * @route /api/v1/auth/login
 * @access public
 */
export const login = expressAsyncHandler(async (req, res) => {
  const { user } = req;

  // Check if user is blocked or inactive
  if (user.isBlocked || user.trash) {
    return res.status(403).json({
      success: false,
      message: "Your account is blocked or inactive.",
    });
  }

  // Check if user is verified
  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before logging in.",
    });
  }

  // Generate JWT token
  const token = jsonwebtoken.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Update last login time
  user.lastLogin = new Date();
  user.isActive = true; // Ensure user is active
  await user.save();

  // Remove password from user object before sending response
  user.password = undefined;

  // Respond with success message and user data
  res.status(200).json({
    success: true,
    message: "Login successful!",
    user,
    token,
  });
});

/**
 * @description create forgot password
 * @method POST
 * @route /api/v1/auth/forgot/password
 * @access public
 */
export const forgotPassword = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  const { email } = req.body;

  // validation
  if (!email) {
    return res.json({ success: false, error: "All fields are required!" });
  }

  // valid email
  if (!isEmailValid(email)) {
    return res.json({ success: false, error: "Invalid email address!" });
  }

  // find user
  const user = await User.findOne({ email });

  // check user
  if (!user) {
    return res.json({ success: false, error: "User not exists!" });
  }

  // create token & token expires
  const resetPasswordToken = randStr(26);
  const resetPasswordTokenExpiry = Date.now() + 10 * (60 * 1000); // 10 minutes

  // update user
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordTokenExpiry = resetPasswordTokenExpiry;
  await user.save();

  // create options for sending verification email
  const options = {
    email: user.email,
    subject: "Reset Password",
    html: `Your reset password url is <strong>${process.env.CLIENT_HOME_PAGE_URL}/reset/password/${resetPasswordToken}</strong>. It is valid for 10 minutes!`,
  };

  // send verification email
  await sendMail(options).catch((error) => {
    console.error("Error sending reset password:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset password url!",
    });
  });

  // response
  res.status(201).json({
    success: true,
    message: "Reset url send successfully!",
  });
});

/**
 * @description create reset password
 * @method POST
 * @route /api/v1/auth/reset/password/:token
 * @access public
 */
export const resetPassword = expressAsyncHandler(async (req, res) => {
  // error
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  const { password } = req.body;
  const { token } = req.params;

  // validation
  if (!password) {
    return res.json({ success: false, error: "All fields are required!" });
  }

  // check password length
  if (password.length < 6) {
    return res.json({
      success: false,
      error: "Password must be at least 6 characters!",
    });
  }

  // find user
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordTokenExpiry: { $gt: Date.now() },
  });

  // check user
  if (!user) {
    return res.json({ success: false, error: "Invalid token!" });
  }

  // hash password
  const hashPass = await bcrypt.hash(password, 10);

  // update user
  user.password = hashPass;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;
  await user.save();

  // create options for sending verification email
  const options = {
    email: user.email,
    subject: "Password Reset Successfully",
    html: `Your verification code is <strong>${process.env.CLIENT_HOME_PAGE_URL}/login</strong>.`,
  };

  // send verification email
  await sendMail(options).catch((error) => {
    console.error("Error sending password reset email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send password reset email!",
    });
  });

  // response
  res.status(201).json({
    success: true,
    message: "Password reset successfully!",
  });
});

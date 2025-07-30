import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const sendMail = async (option) => {
  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // create message object
  const message = {
    from: process.env.SMTP_USER,
    to: option.email,
    subject: option.subject,
    html: option.html,
  };

  // Send the email using the transporter
  try {
    await transporter.sendMail(message);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Export the sendMail function
export default sendMail;

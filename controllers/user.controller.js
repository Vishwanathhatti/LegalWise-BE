import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "../models/user.model.js";
import "dotenv/config";
import redisClient from "../utils/redis.js";
import exp from "constants";
import nodemailer from "nodemailer"

export const registerUser = async (req, res) => {
  const { name, email, phoneNumber, password } = req.body;

  try {
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const existingUser = await userModel.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? `Email: ${email} already exists`
            : `Contact Number: ${phoneNumber} already exists`,
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
    });
    
    res.status(200).json({
      message: "User Registered Successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  const { email, password, deviceId, deviceInfo } = req.body; // ✅ include device info from frontend

  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Credentials",
        success: false,
      });
    }

    const isPasswordVerified = await bcrypt.compare(password, user.password);

    if (!isPasswordVerified) {
      return res.status(400).json({
        message: "Invalid Credentials",
        success: false,
      });
    }

    // ✅ Save last login
    const updateLogin = await userModel.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    if (!updateLogin) {
      return res.status(400).json({
        message: "Something went wrong",
        success: false,
      });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { userId: user._id, deviceId: deviceId }, // Payload (first argument)
      process.env.SECRET_KEY,                  // Secret key (second argument)
      { expiresIn: '1d' }                      // Optional: token expiration
    );

    // ✅ Save session token in Redis
    const redisKey = `session:${user._id}:${deviceId}`;
    await redisClient.set(redisKey, token, 'EX', 86400); // 1 day expiration

    // ✅ Save device info in Redis
    const deviceInfoKey = `device-info:${user._id}:${deviceId}`;
    await redisClient.set(deviceInfoKey, JSON.stringify(deviceInfo), 'EX', 86400);

    const { password: _, ...userWithoutPassword } = user._doc;

    userWithoutPassword.token = token;

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${user.name}`,
        user: userWithoutPassword,
        token,
        success: true,
      });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};


// logout

export const logout = async (req, res) => {
  const userId = req.id; 
  const deviceId = req.deviceId; // Extract deviceId from the request

  console.log(userId, deviceId);

  if (!userId || !deviceId) {
    return res.status(400).json({
      message: "Missing userId or deviceId",
      success: false,
    });
  }

  try {
    const redisKey = `session:${userId}:${deviceId}`;
    const deviceInfoKey = `device-info:${userId}:${deviceId}`;

    // Delete session token and device info from Redis
    await redisClient.del(redisKey);
    await redisClient.del(deviceInfoKey);

    return res.status(200).json({
      message: "Successfully logged out",
      success: true,
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      message: "Logout failed",
      success: false,
    });
  }
};


// setup nodemailer
const sendResetPasswordMail = async (fullname, email, resettoken) => {
  try {
    // Configure the transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // or 465 for secure
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_EMAIL, // Your email
        pass: process.env.SMTP_PASSWORD, // Your Gmail App password (use the correct one)
      },  
    });

    // Mail options
    const mailOptions = {
      from: "vishwanathhatti30@gmail.com", // Your email (same as auth user)
      to: email, // Recipient's email
      subject: "Reset Your Password", // Email subject
      html: `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
          color: #1f2937;
          line-height: 1.5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .email-header {
          text-align: center;
          padding: 30px 0;
        }
        .logo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background-color: #3b82f6;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .email-body {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        h2 {
          color: #111827;
          margin-top: 0;
          margin-bottom: 24px;
          font-weight: 600;
        }
        p {
          margin-bottom: 16px;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #2563eb;
        }
        .info {
          font-size: 14px;
          color: #6b7280;
          margin-top: 24px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          color: #6b7280;
          font-size: 12px;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
          }
          .email-body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-header">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>
        
        <div class="email-body">
          <h2>Reset Your Password</h2>
          <p>Hello ${fullname},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resettoken}" class="button">Reset Password</a>
          </div>
          
          <div class="info">
            <p>If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>
            <p>This password reset link will expire in 24 hours.</p>
          </div>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px;">Need help? Contact our support team at <a href="mailto:vishwanathhatti30@gmail.com" style="color:#3b82f6;">vishwanathhatti30@gmail.com</a></p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 LegalWise. All rights reserved.</p>
          <p>Pune, India</p>
        </div>
      </div>
    </body>
    </html>`
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

// forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Save token to Redis
    await redisClient.set(`resetPassword:${user._id}`, resetToken, 'EX', 3600);

    // Generate reset link
    const resetLink = `http://localhost:5000/reset-password/${resetToken}`; // change domain in production

    // Send email
    await sendResetPasswordMail(user.name, user.email, resetLink);

    return res.status(200).json({
      message: "Reset password link sent to your email",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};


export const resetPassword = async (req, res) => {
  const resetToken = req.params.token;
  const { newPassword } = req.body;

  try {
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
        success: false,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.SECRET_KEY);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: "Reset token has expired",
          success: false,
        });
      }
      return res.status(400).json({
        message: "Invalid reset token",
        success: false,
      });
    }

    const redisToken = await redisClient.get(`resetPassword:${decoded.userId}`);

    if (!redisToken || redisToken !== resetToken) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userModel.updateOne(
      { _id: decoded.userId },
      { $set: { password: hashedPassword } }
    );

    await redisClient.del(`resetPassword:${decoded.userId}`);

    return res.status(200).json({
      message: "Password reset successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};

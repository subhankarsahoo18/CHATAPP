import mongoose from "mongoose";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { connectDB } from "../lib/db.js";
import { generateToken, isProduction } from "../lib/utils.js";

// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database unavailable. Check your MongoDB connection and try again.",
      });
    }

    const { fullName, email, password, username, mobileNumber } = req.body;

    if (!fullName || !email || !password || !username || !mobileNumber) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be 6+ chars" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const mobileExists = await User.findOne({ mobileNumber });
    if (mobileExists) {
      return res.status(400).json({ message: "Mobile number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      username,
      mobileNumber,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id, res);

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      username: newUser.username,
      mobileNumber: newUser.mobileNumber,
      email: newUser.email,
      profilePic: newUser.profilePic,
      about: newUser.about,
      token,
    });

  } catch (error) {
    console.log("Signup error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database unavailable. Check your MongoDB connection and try again.",
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      mobileNumber: user.mobileNumber,
      email: user.email,
      profilePic: user.profilePic,
      about: user.about || "Hey there! I am using Gupshup.",
      token,
    });

  } catch (error) {
    console.log("Login error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= LOGOUT =================
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 0,
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= CHECK AUTH =================
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, username, mobileNumber, fullName, about } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (about !== undefined) updates.about = about;

    if (username && username !== req.user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already exists" });
      }
      updates.username = username;
    }

    if (mobileNumber && mobileNumber !== req.user.mobileNumber) {
      const mobileExists = await User.findOne({ mobileNumber });
      if (mobileExists) {
        return res.status(400).json({ message: "Mobile number already exists" });
      }
      updates.mobileNumber = mobileNumber;
    }

    if (profilePic && profilePic !== req.user.profilePic && profilePic.startsWith("data:image")) {
       const uploadResponse = await cloudinary.uploader.upload(profilePic, {
         folder: "chat_profiles",
         resource_type: "image",
         timeout: 120000, // 2 minutes
         transformation: [
           { width: 500, height: 500, crop: "limit" },
           { quality: "auto" }
         ]
       });
       updates.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);

  } catch (error) {
    console.log("🔥 FULL ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};


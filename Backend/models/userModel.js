import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    profilePic: {   // ✅ FIXED NAME
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "Hey there! I am using Gupshup.",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

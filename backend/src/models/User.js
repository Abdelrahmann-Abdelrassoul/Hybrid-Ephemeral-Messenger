import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
    },

    photoURL: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// IMPORTANT:
// Do NOT add message fields here.
// MongoDB stores only permanent user identity metadata.

const User = mongoose.model("User", userSchema);

export default User;
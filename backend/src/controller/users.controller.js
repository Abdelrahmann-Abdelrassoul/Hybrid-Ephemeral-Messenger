import User from "../models/User.js";

export async function listUsers(req, res) {
  try {
    const users = await User.find({ uid: { $ne: req.user.uid } })
      .select("uid displayName photoURL createdAt updatedAt")
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("listUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
}

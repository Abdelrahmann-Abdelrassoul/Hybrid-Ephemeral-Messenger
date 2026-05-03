import User from "../models/User.js";

export const loginController = async (req, res, next) => {
  try {
    const firebaseUser = req.user;

    if (!firebaseUser || !firebaseUser.uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Firebase user not found",
      });
    }

    let user = await User.findOne({ uid: firebaseUser.uid });

    if (user) {
      return res.status(200).json({
        success: true,
        message: "Returning user logged in successfully",
        isNewUser: false,
        pulse: req.authPulseMessage,
        user,
      });
    }

    user = await User.create({
      uid: firebaseUser.uid,
      displayName: firebaseUser.name || "",
      photoURL: firebaseUser.picture || "",
    });

    return res.status(201).json({
      success: true,
      message: "New user registered silently and logged in successfully",
      isNewUser: true,
      pulse: req.authPulseMessage,
      user,
    });
  } catch (error) {
    next(error);
  }
};
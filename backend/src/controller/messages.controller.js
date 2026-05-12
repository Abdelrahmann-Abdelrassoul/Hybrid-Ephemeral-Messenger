import { getMessages } from "../services/message.service.js";

export async function getMessageHistory(req, res) {
  try {
    const { receiverUid } = req.params;

    if (!receiverUid || typeof receiverUid !== "string") {
      return res.status(400).json({
        success: false,
        message: "receiverUid is required",
      });
    }

    if (receiverUid === req.user.uid) {
      return res.status(400).json({
        success: false,
        message: "receiverUid must be a different user",
      });
    }

    const messages = await getMessages(req.user.uid, receiverUid);

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("getMessageHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
}

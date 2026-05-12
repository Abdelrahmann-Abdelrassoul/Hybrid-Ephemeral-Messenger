import { getMessagesWithTTL } from "../services/message.service.js";

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
        message: "Cannot message yourself",
      });
    }

    const { messages, ttl } = await getMessagesWithTTL(req.user.uid, receiverUid);

    return res.status(200).json({
      success: true,
      messages,
      ttl,
    });
  } catch (error) {
    console.error("getMessageHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
}

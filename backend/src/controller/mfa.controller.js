import { createSmsVerification, isLikelyE164 } from "../services/twilioVerify.service.js";
import { setPendingMfa } from "../services/mfaState.service.js";

export async function startMfaController(req, res) {
  try {
    const phoneNumber = req.body?.phoneNumber;
    if (!isLikelyE164(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "phoneNumber is required in E.164 format (e.g. +20101234567)",
      });
    }

    const verification = await createSmsVerification(phoneNumber.trim());

    try {
      await setPendingMfa(req.user.uid);
    } catch (redisErr) {
      console.error("mfa/start redis:", redisErr?.message ?? "unknown");
      return res.status(503).json({
        success: false,
        message: "Verification SMS was sent but MFA session could not be stored. Try again shortly.",
      });
    }

    return res.status(200).json({
      success: true,
      status: verification.status,
    });
  } catch (error) {
    if (error?.message === "TWILIO_NOT_CONFIGURED") {
      return res.status(503).json({
        success: false,
        message: "MFA is not configured on the server",
      });
    }

    console.error("mfa/start:", error?.message ?? "unknown");
    return res.status(502).json({
      success: false,
      message: "Failed to send verification SMS",
    });
  }
}

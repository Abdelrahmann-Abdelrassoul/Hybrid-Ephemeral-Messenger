import {
  createSmsVerification,
  checkSmsVerification,
  isLikelyE164,
} from "../services/twilioVerify.service.js";
import { setPendingMfa, getPendingMfa, clearPendingMfa } from "../services/mfaState.service.js";

const PENDING_MFA = "PENDING_MFA";

function isValidOtpCode(code) {
  if (typeof code !== "string") return false;
  const t = code.trim();
  return /^\d{4,10}$/.test(t);
}

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

export async function verifyMfaController(req, res) {
  try {
    const phoneNumber = req.body?.phoneNumber;
    const code = req.body?.code;

    if (!isLikelyE164(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "phoneNumber is required in E.164 format (e.g. +20101234567)",
      });
    }

    if (!isValidOtpCode(code)) {
      return res.status(400).json({
        success: false,
        message: "code must be 4–10 digits",
      });
    }

    let pending;
    try {
      pending = await getPendingMfa(req.user.uid);
    } catch (redisErr) {
      console.error("mfa/verify redis read:", redisErr?.message ?? "unknown");
      return res.status(503).json({
        success: false,
        message: "Could not read MFA session",
      });
    }
    if (pending !== PENDING_MFA) {
      return res.status(400).json({
        success: false,
        message: "MFA session not started or expired",
      });
    }

    const check = await checkSmsVerification(phoneNumber.trim(), code.trim());

    if (check.status !== "approved") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired verification code",
        status: check.status,
      });
    }

    try {
      await clearPendingMfa(req.user.uid);
    } catch (clearErr) {
      console.error("mfa/verify redis clear:", clearErr?.message ?? "unknown");
    }

    return res.status(200).json({
      success: true,
      status: check.status,
    });
  } catch (error) {
    if (error?.message === "TWILIO_NOT_CONFIGURED") {
      return res.status(503).json({
        success: false,
        message: "MFA is not configured on the server",
      });
    }

    console.error("mfa/verify:", error?.message ?? "unknown");
    return res.status(401).json({
      success: false,
      message: "Invalid or expired verification code",
    });
  }
}

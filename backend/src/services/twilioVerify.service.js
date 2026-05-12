import twilio from "twilio";

const CONFIG_ERR = "TWILIO_NOT_CONFIGURED";

function getVerifyEnv() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (!accountSid || !authToken || !serviceSid) {
    return null;
  }
  return { accountSid, authToken, serviceSid };
}


export async function createSmsVerification(e164Phone) {
  const env = getVerifyEnv();
  if (!env) {
    const err = new Error(CONFIG_ERR);
    throw err;
  }
  const client = twilio(env.accountSid, env.authToken);
  return client.verify.v2.services(env.serviceSid).verifications.create({
    to: e164Phone,
    channel: "sms",
  });
}

export function isLikelyE164(phone) {
  if (typeof phone !== "string") return false;
  const t = phone.trim();
  return /^\+[1-9]\d{6,14}$/.test(t);
}

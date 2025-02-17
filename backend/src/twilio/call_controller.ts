// backend/src/twilio/call_controller.ts
import { Twilio } from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const endCall = async (callSid: string) => {
  try {
    await client.calls(callSid).update({ status: "completed" });
    return { success: true };
  } catch (error) {
    console.error("Error ending call:", error);
    throw error;
  }
};

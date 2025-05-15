import dotenv from "dotenv";
import { SMSManager, CallManager } from "@fonoster/sdk";
dotenv.config();

const messagingClient =  new SMSManager();
const voiceClient = new CallManager();

export async function sendSMS(to, message) {
  try {
    const response = await messagingClient.sendSMS({
      from: process.env.FONOSTER_NUMBER,
      to,
      text: message,
    });
    console.log("✅ SMS sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    throw error;
  }
}

export async function makeCall(to, from = process.env.FONOSTER_NUMBER, app) {
  try {
    const response = await voiceClient.call({
      from,
      to,
      app,
    });
    console.log("📞 Voice call initiated:", response);
    return response;
  } catch (error) {
    console.error("❌ Error making call:", error);
    throw error;
  }
}

const dotenv = require("dotenv");
dotenv.config();

export interface AppConfig {
  port: number;
  twilioAccountSid: string;
  twilioAuthToken: string;
  nodeEnv: "development" | "production";
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "5000", 10),
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  nodeEnv: process.env.NODE_ENV === "production" ? "production" : "development",
};

const requiredEnvVars = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "COHERE_API_KEY",
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

import express from "express";
import dotenv from "dotenv";
import { handleVoiceCall } from "./twilio/voice-handler";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route that calls your voice handler
app.post("/voice", handleVoiceCall);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

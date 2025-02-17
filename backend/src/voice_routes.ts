import express from "express";
import { handleVoiceCall, handleVoiceResponse } from "./twilio/voice_handler";

const router = express.Router();

router.post("/", handleVoiceCall);
router.post("/respond", handleVoiceResponse);

export default router;

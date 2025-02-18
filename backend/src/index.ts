import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { handleVoiceCall, handleVoiceResponse } from "./twilio/voice_handler";
import { conversationManager } from "./ai/conversation_manager";
import { biasDetector } from "./ai/bias_detector";
import { endCall } from "./twilio/call_controller";
import cors from "cors";
import dotenv from "dotenv";
import { Conversation } from "./types/conversation"; // Added import for Conversation

dotenv.config();

// Initialize BiasDetector with the model ID from .env
const modelId = process.env.COHERE_MODEL_ID;
if (!modelId) {
  console.error("COHERE_MODEL_ID is not set in .env file");
} else {
  biasDetector
    .initialize(modelId)
    .then(() => console.log("BiasDetector initialized successfully"))
    .catch((err) => console.error("Error initializing BiasDetector:", err));
}

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/conversations", (req, res) => {
  const data = Array.from(conversationManager["conversations"].values());
  res.json(data);
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/voice", handleVoiceCall);
app.post("/voice/respond", handleVoiceResponse);

app.post("/api/call/end", async (req, res) => {
  try {
    const { callSid } = req.body;
    if (!callSid) {
      return res.status(400).json({ error: "CallSid is required" });
    }
    await endCall(callSid);
    conversationManager.updateConversationStatus(callSid, "completed");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.emit(
    "conversationUpdate",
    Array.from(conversationManager["conversations"].values())
  );

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Updated event handlers using the new event names and type for Conversation
conversationManager.on("conversationUpdated", (data: Conversation) => {
  io.emit("conversationUpdate", data);
});

conversationManager.on("conversationEnded", (data: Conversation) => {
  io.emit("conversationEnded", data);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

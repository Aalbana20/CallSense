import { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { TwiMLBuilder, createErrorResponse } from "./twiml_utils";
import { conversationManager } from "../ai/conversation_manager";
import { analyzeUtterance } from "../ai/bias_detector";
import { endCall } from "./call_controller";
import { ConversationInput, ConversationTurn } from "../types";

interface ConversationTurn {
  role: "user" | "system";
  text: string;
  sentiment?: string;
  timestamp: string;
}

type ConversationTurnInput = Omit<ConversationTurn, "timestamp"> & {
  timestamp: string;
};

let io: SocketIOServer;

export const initializeSocketIO = (socketIO: SocketIOServer) => {
  io = socketIO;
};

export const handleVoiceCall = (req: Request, res: Response) => {
  console.log("Incoming voice call:", req.body);

  const callSid = req.body.CallSid;

  if (!callSid) {
    console.error("No CallSid provided in incoming call");
    return res.type("text/xml").send(createErrorResponse().toString());
  }

  try {
    // Initialize a new conversation for this call
    conversationManager.createConversation(callSid, {
      status: "in-progress",
      startTime: new Date().toISOString(),
      turns: [],
    });

    const initialGreeting = "Welcome to CallSim AI. How can I help you today?";

    // Record the system's initial greeting
    const systemTurn: ConversationTurnInput = {
      role: "system",
      text: initialGreeting,
      timestamp: new Date().toISOString(),
    };
    conversationManager.addTurn(callSid, systemTurn);

    // Emit incoming call event to dashboard
    io?.emit("incomingCall", {
      CallSid: callSid,
      Called: req.body.Called,
      From: req.body.From,
      CallStatus: req.body.CallStatus,
      Direction: req.body.Direction,
      FromCity: req.body.FromCity,
      FromState: req.body.FromState,
      timestamp: new Date().toISOString(),
    });

    const twiml = new TwiMLBuilder()
      .addGreeting(initialGreeting)
      .addPause()
      .addGather("Please speak after the tone.")
      .build();

    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Error in voice call handler:", error);
    res.type("text/xml").send(createErrorResponse().toString());
  }
};

export const handleVoiceResponse = async (req: Request, res: Response) => {
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult;

  console.log("Voice response request body:", req.body);

  if (!callSid) {
    console.error("No CallSid provided in voice response");
    return res.type("text/xml").send(createErrorResponse().toString());
  }

  try {
    if (!speechResult) {
      console.log("No speech result, sending gather response");
      const twiml = new TwiMLBuilder()
        .addGreeting("I didn't catch that.")
        .addPause()
        .addGather("Could you please repeat that?")
        .build();
      return res.type("text/xml").send(twiml.toString());
    }

    // Verify conversation exists
    const conversation = conversationManager.getConversation(callSid);
    if (!conversation) {
      console.error("No conversation found for CallSid:", callSid);
      // Create conversation if it doesn't exist (fallback)
      conversationManager.createConversation(callSid, {
        status: "in-progress",
        startTime: new Date().toISOString(),
        turns: [],
      });
    }

    // Emit speech recognition event
    io?.emit("speechResult", {
      CallSid: callSid,
      SpeechResult: speechResult,
      Confidence: req.body.Confidence,
      Language: req.body.Language,
      timestamp: new Date().toISOString(),
    });

    // Analyze the user's speech
    const biasResult = await analyzeUtterance(speechResult);
    console.log("Bias Analysis Result:", biasResult);

    // Emit sentiment analysis event
    io?.emit("sentimentAnalysis", {
      CallSid: callSid,
      sentiment: {
        prediction: biasResult.prediction,
        confidence: biasResult.confidence,
        timestamp: new Date().toISOString(),
      },
    });

    // Record the user's turn
    const userTurn: ConversationTurnInput = {
      role: "user",
      text: speechResult,
      sentiment: biasResult.prediction,
      timestamp: new Date().toISOString(),
    };
    conversationManager.addTurn(callSid, userTurn);

    const twiml = new TwiMLBuilder()
      .addGreeting("I heard you. Let me process that.")
      .addPause()
      .addGather("Is there anything else I can help you with?")
      .build();

    // Record the system's response
    const systemTurn: ConversationTurnInput = {
      role: "system",
      text: "I heard you. Let me process that. Is there anything else I can help you with?",
      timestamp: new Date().toISOString(),
    };
    conversationManager.addTurn(callSid, systemTurn);

    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Error in voice response handler:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Emit error event
    io?.emit("callError", {
      CallSid: callSid,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    res.type("text/xml").status(500).send(createErrorResponse().toString());
  }
};

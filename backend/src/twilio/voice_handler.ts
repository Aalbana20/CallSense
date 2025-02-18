import { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { TwiMLBuilder, createErrorResponse } from "./twiml_utils";
import { conversationManager } from "../ai/conversation_manager";
import { analyzeUtterance } from "../ai/bias_detector";
import {
  ConversationInput,
  ConversationTurn,
  ConversationTurnInput,
} from "../types/conversation";

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

    const initialGreeting = "Welcome to Call Sense. How can I help you today?";

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

    // Create TwiML without a spoken gather prompt.
    const twiml = new TwiMLBuilder()
      .addGreeting(initialGreeting)
      .addPause()
      .addGather("") // Removed "Please speak after the tone." text
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
    // If no speech is captured, prompt the user again.
    if (!speechResult) {
      console.log("No speech result, sending gather response");
      const twiml = new TwiMLBuilder()
        .addGreeting("I didn't catch that.")
        .addPause()
        .addGather("") // No spoken prompt here either
        .build();
      return res.type("text/xml").send(twiml.toString());
    }

    // Convert speech to lowercase for termination check.
    const speechResultLower = speechResult.toLowerCase();

    // Check for termination keywords.
    if (
      speechResultLower === "no" ||
      speechResultLower === "goodbye" ||
      speechResultLower === "bye"
    ) {
      let conversation = conversationManager.getConversation(callSid);
      if (!conversation) {
        // Fallback: create a conversation if one doesn't exist.
        conversationManager.createConversation(callSid, {
          status: "completed",
          startTime: new Date().toISOString(),
          turns: [],
        });
        conversation = conversationManager.getConversation(callSid);
      } else {
        conversation.status = "completed";
      }
      const currentTimestamp = new Date().toISOString();

      // Record the final user turn.
      const userTurn: ConversationTurnInput = {
        role: "user",
        text: speechResult,
        timestamp: currentTimestamp,
      };
      conversationManager.addTurn(callSid, userTurn);

      // Record the final system response.
      const farewellMessage = "Thank you for your time. Goodbye!";
      const systemTurn: ConversationTurnInput = {
        role: "system",
        text: farewellMessage,
        timestamp: currentTimestamp,
      };
      conversationManager.addTurn(callSid, systemTurn);

      // End the call.
      const twiml = new TwiMLBuilder()
        .addGreeting(farewellMessage)
        .addHangup()
        .build();
      return res.type("text/xml").send(twiml.toString());
    }

    // Ensure conversation exists for non-terminating speech.
    let conversation = conversationManager.getConversation(callSid);
    if (!conversation) {
      conversationManager.createConversation(callSid, {
        status: "in-progress",
        startTime: new Date().toISOString(),
        turns: [],
      });
    }

    // Emit speech recognition event.
    io?.emit("speechResult", {
      CallSid: callSid,
      SpeechResult: speechResult,
      Confidence: req.body.Confidence,
      Language: req.body.Language,
      timestamp: new Date().toISOString(),
    });

    // Analyze the user's speech.
    const biasResult = await analyzeUtterance(speechResult);
    console.log("Bias Analysis Result:", biasResult);

    // Emit sentiment analysis event.
    io?.emit("sentimentAnalysis", {
      CallSid: callSid,
      sentiment: {
        prediction: biasResult.prediction,
        confidence: biasResult.confidence,
        timestamp: new Date().toISOString(),
      },
    });

    const currentTimestamp = new Date().toISOString();

    // Record the user's turn.
    const userTurn: ConversationTurnInput = {
      role: "user",
      text: speechResult,
      sentiment: biasResult.prediction,
      timestamp: currentTimestamp,
    };
    conversationManager.addTurn(callSid, userTurn);

    // Prepare system's response.
    const systemMessage =
      "I heard you. Let me process that. Is there anything else I can help you with?";
    const twiml = new TwiMLBuilder()
      .addGreeting(systemMessage)
      .addPause()
      .addGather("") // Removed the prompt text here as well.
      .build();

    // Record the system's response turn.
    const systemTurn: ConversationTurnInput = {
      role: "system",
      text: systemMessage,
      timestamp: currentTimestamp,
    };
    conversationManager.addTurn(callSid, systemTurn);

    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Error in voice response handler:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Emit error event.
    io?.emit("callError", {
      CallSid: callSid,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    res.type("text/xml").status(500).send(createErrorResponse().toString());
  }
};

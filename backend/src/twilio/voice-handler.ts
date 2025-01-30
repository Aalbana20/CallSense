import { Request, Response } from "express";
import twilio from "twilio";

export const handleVoiceCall = (req: Request, res: Response) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say({ voice: "alice" }, 
        "Hello! This is the AI Call Simulator"
    );
    // Add a pause
    twiml.pause({ length: 1 });

    // Ask a question and gather response
    const gather = twiml.gather({
      input: ["speech"],
      timeout: 3,
      language: "en-US",
    });

    gather.say("How can I help you today?");

    // If no input received
    twiml.say("I did not receive any input. Goodbye!");

    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error in voice handler:", error);
    const errorResponse = new twilio.twiml.VoiceResponse();
    errorResponse.say("Sorry, an error occurred");
    res.type("text/xml").status(500).send(errorResponse.toString());
  }
};

import VoiceResponse = require("twilio/lib/twiml/VoiceResponse");

export class TwiMLBuilder {
  private twiml: VoiceResponse;

  constructor() {
    this.twiml = new VoiceResponse();
  }

  addGreeting(message: string) {
    this.twiml.say(
      {
        voice: "alice" as const,
        language: "en-US",
      },
      message
    );
    return this;
  }

  addPause(length: number = 1) {
    this.twiml.pause({ length }); // Remove toString()
    return this;
  }

  addGather(prompt: string) {
    const gather = this.twiml.gather({
      input: ["speech"] as const,
      action: "/voice/respond",
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
      enhanced: true, // Changed from "true" to true
    });

    gather.say(
      {
        voice: "alice" as const,
        language: "en-US",
      },
      prompt
    );
    return this;
  }

  addFallback(message: string) {
    this.twiml.say(
      {
        voice: "alice" as const,
        language: "en-US",
      },
      message
    );
    return this;
  }

  addHangup() {
    this.twiml.hangup();
    return this;
  }

  build() {
    try {
      const twimlString = this.twiml.toString();
      if (!twimlString || twimlString.length === 0) {
        throw new Error("Generated TwiML is empty");
      }
      return this.twiml;
    } catch (error) {
      console.error("Error building TwiML:", error);
      return createErrorResponse();
    }
  }
}

export const createErrorResponse = () => {
  const twiml = new VoiceResponse();
  twiml.say(
    {
      voice: "alice" as const,
      language: "en-US",
    },
    "We encountered an error. Please try your call again later."
  );
  twiml.hangup();
  return twiml;
};

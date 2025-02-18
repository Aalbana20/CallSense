export interface ConversationTurn {
  id: string;
  role: "user" | "system";
  text: string;
  sentiment?: string;
  timestamp: string;
}

export interface ConversationTurnInput {
  role: "user" | "system";
  text: string;
  sentiment?: string;
  timestamp: string;
}

export interface ConversationInput {
  status: "in-progress" | "completed" | "error";
  startTime: string;
  turns: ConversationTurn[];
}

export interface Conversation {
  callSid: string;
  status: "in-progress" | "completed" | "error";
  startTime: string;
  endTime?: string;
  turns: ConversationTurn[];
}

export type ConversationEventTypes =
  | "conversationUpdated"
  | "conversationEnded";

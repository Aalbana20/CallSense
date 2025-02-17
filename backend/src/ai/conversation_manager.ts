import { EventEmitter } from "events";
import {
  Conversation,
  ConversationTurn,
  ConversationEventTypes,
} from "../types";

export class ConversationManager extends EventEmitter {
  private conversations: Map<string, Conversation>;

  constructor() {
    super();
    this.conversations = new Map();
  }

  createConversation(
    callSid: string,
    data: Omit<Conversation, "callSid">
  ): void {
    if (this.conversations.has(callSid)) {
      console.warn(`Conversation already exists for CallSid: ${callSid}`);
      return;
    }

    const conversation: Conversation = {
      callSid,
      ...data,
    };

    this.conversations.set(callSid, conversation);
    this.emit("conversationUpdated", conversation);
    console.log(`Created new conversation for CallSid: ${callSid}`);
  }

  getConversation(callSid: string): Conversation | undefined {
    return this.conversations.get(callSid);
  }

  addTurn(callSid: string, turn: Omit<ConversationTurn, "id">): void {
    const conversation = this.conversations.get(callSid);
    if (!conversation) {
      console.error(`No conversation found for CallSid: ${callSid}`);
      return;
    }

    const turnWithId = {
      ...turn,
      id: `${callSid}-${conversation.turns.length}`,
    };

    conversation.turns.push(turnWithId);
    this.conversations.set(callSid, conversation);
    this.emit("conversationUpdated", conversation);
    console.log(`Added turn to conversation ${callSid}:`, turnWithId);
  }

  updateConversationStatus(
    callSid: string,
    status: Conversation["status"]
  ): void {
    const conversation = this.conversations.get(callSid);
    if (!conversation) {
      console.error(`No conversation found for CallSid: ${callSid}`);
      return;
    }

    conversation.status = status;
    if (status === "completed") {
      conversation.endTime = new Date().toISOString();
      this.emit("conversationEnded", conversation);
    }

    this.conversations.set(callSid, conversation);
    this.emit("conversationUpdated", conversation);
    console.log(`Updated conversation ${callSid} status to: ${status}`);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  deleteConversation(callSid: string): void {
    const conversation = this.conversations.get(callSid);
    if (conversation) {
      this.conversations.delete(callSid);
      this.emit("conversationEnded", conversation);
      console.log(`Deleted conversation: ${callSid}`);
    }
  }

  on(
    event: ConversationEventTypes,
    listener: (conversation: Conversation) => void
  ): this {
    return super.on(event, listener);
  }
}

export const conversationManager = new ConversationManager();

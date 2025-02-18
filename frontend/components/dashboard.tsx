"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Phone, MessageSquare, Activity } from "lucide-react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

interface ConversationTurn {
  role: "user" | "system";
  text: string;
  timestamp: string;
  sentiment?: string;
  biasScore?: number;
}

interface Conversation {
  callSid: string;
  turns: ConversationTurn[];
  startTime: string;
  endTime?: string;
  status: "active" | "completed" | "error";
}

const Dashboard: React.FC = () => {
  // Initialize conversations as an empty array
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server:", newSocket.id);
    });

    // Handle conversation updates
    newSocket.on("conversationUpdate", (data: any) => {
      console.log("Received conversation update:", data);

      // Ensure data is properly formatted as an array of conversations
      let updatedConversations: Conversation[];

      if (Array.isArray(data)) {
        updatedConversations = data;
      } else if (data && typeof data === "object") {
        // If single conversation object received
        updatedConversations = [data];
      } else {
        updatedConversations = [];
      }

      setConversations(updatedConversations);
    });

    // Handle sentiment analysis updates
    newSocket.on("sentimentAnalysis", (data: any) => {
      console.log("Received sentiment analysis:", data);
      if (!data || !data.CallSid) return;

      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.callSid === data.CallSid) {
            const updatedTurns = conv.turns.map((turn, index) => {
              // Update the latest user turn with sentiment
              if (index === conv.turns.length - 2 && turn.role === "user") {
                return {
                  ...turn,
                  sentiment: data.sentiment.prediction,
                  biasScore: data.sentiment.confidence,
                };
              }
              return turn;
            });
            return { ...conv, turns: updatedTurns };
          }
          return conv;
        });
      });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      case "angry":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Guard against non-array conversations data
  if (!Array.isArray(conversations)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 p-8">
        <section className="mt-12 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Live Simulations
          </h2>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>No live simulation data available.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 p-8">
      <section className="mt-12 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Live Simulations
        </h2>
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>No live simulation data available.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {conversations.map((conv) => (
              <Card key={conv.callSid} className="p-6 relative">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      Call SID: {conv.callSid}
                    </CardTitle>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                        conv.status
                      )}`}
                    >
                      {conv.status.charAt(0).toUpperCase() +
                        conv.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Started: {new Date(conv.startTime).toLocaleString()}</p>
                    {conv.endTime && (
                      <p>Ended: {new Date(conv.endTime).toLocaleString()}</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {conv.turns.map((turn, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg ${
                          turn.role === "system"
                            ? "bg-blue-50 dark:bg-blue-900/30 ml-auto"
                            : "bg-gray-50 dark:bg-gray-800/50 mr-auto"
                        } max-w-[80%]`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize text-gray-600 dark:text-gray-300">
                            {turn.role}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(turn.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">
                          {turn.text}
                        </p>
                        {turn.sentiment && (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${getSentimentColor(
                                turn.sentiment
                              )}`}
                            >
                              Sentiment: {turn.sentiment}
                            </span>
                            {turn.biasScore && (
                              <span className="text-xs text-gray-500">
                                Confidence: {(turn.biasScore * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

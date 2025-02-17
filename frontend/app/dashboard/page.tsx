// frontend/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // Make sure to create this component

interface ConversationTurn {
  role: "user" | "system";
  text: string;
  timestamp: string;
  biasScore?: number;
  sentiment?: string;
}

interface Conversation {
  callSid: string;
  turns: ConversationTurn[];
  startTime: string;
  endTime?: string;
  status: "active" | "completed" | "error";
}

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Establish socket connection and handle live updates
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server:", newSocket.id);
    });

    newSocket.on("conversationUpdate", (data: Conversation[]) => {
      console.log("Received conversation update:", data);
      setConversations(data);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    // Clean up socket on unmount
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 p-8">
      {/* Live Conversations Section */}
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
                    <p>
                      Duration:{" "}
                      {conv.endTime
                        ? `${Math.round(
                            (new Date(conv.endTime).getTime() -
                              new Date(conv.startTime).getTime()) /
                              1000
                          )} seconds`
                        : "Ongoing"}
                    </p>
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
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Sentiment:
                            <span
                              className={`ml-1 px-2 py-0.5 rounded ${
                                turn.sentiment === "positive"
                                  ? "bg-green-100 text-green-800"
                                  : turn.sentiment === "negative"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {turn.sentiment}
                            </span>
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
}

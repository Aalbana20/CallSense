import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Phone, MessageSquare, Activity } from "lucide-react";

const CallDashboard = () => {
  // Sample data structure based on your logs
  const callData = {
    callDetails: {
      callSid: "CA19cf36fa092d697eb29b49df1a91b2bf",
      from: "+17138553899",
      to: "+18314803042",
      status: "in-progress",
      direction: "inbound",
      fromCity: "HOUSTON",
      fromState: "TX",
    },
    speechAnalysis: {
      result: "I am angry.",
      confidence: "0.64887846",
      language: "en-US",
    },
    sentimentAnalysis: {
      prediction: "angry",
      confidence: 0.9476252,
    },
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Call Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Call Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Call SID</p>
              <p className="font-mono">{callData.callDetails.callSid}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-800">
                  {callData.callDetails.status}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">From</p>
              <p>{callData.callDetails.from}</p>
              <p className="text-sm text-gray-500">
                {callData.callDetails.fromCity},{" "}
                {callData.callDetails.fromState}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">To</p>
              <p>{callData.callDetails.to}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speech Recognition Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Speech Recognition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Transcription</p>
              <p className="text-lg font-medium mt-1">
                {callData.speechAnalysis.result}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="font-medium">
                  {(
                    parseFloat(callData.speechAnalysis.confidence) * 100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Language</p>
                <p className="font-medium">
                  {callData.speechAnalysis.language}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Detected Sentiment</p>
              <p className="text-lg font-medium mt-1 capitalize">
                {callData.sentimentAnalysis.prediction}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Confidence</p>
              <p className="font-medium">
                {(callData.sentimentAnalysis.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallDashboard;

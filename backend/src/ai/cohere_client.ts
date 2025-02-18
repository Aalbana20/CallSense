import axios, { AxiosError } from "axios";
import { trainingData } from "./training_data";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface ClassificationResult {
  prediction: string;
  confidence: number;
  error?: string;
}

interface CohereError {
  message: string;
  details?: { [key: string]: any };
}

export class CohereClient {
  private apiKey: string;
  private modelId: string = "";
  private baseUrl = "https://api.cohere.ai/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Cohere-Version": "2024-02-01",
    };
  }

  async trainModel(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/classify/train`,
        {
          training_data: trainingData,
          model_name: `sentiment-classifier-${Date.now()}`,
          description:
            "Classifies customer service sentiment as angry, neutral, or positive",
          tags: ["sentiment", "customer-service"],
        },
        { headers: this.headers }
      );

      if (!response.data.id) {
        throw new Error("No model ID returned from training");
      }
      this.modelId = response.data.id;
      return this.modelId;
    } catch (error) {
      const errorResult = this.handleError("Error training model", error);
      throw new Error(errorResult.message);
    }
  }

  async checkTrainingStatus(modelId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/classify/train/${modelId}`,
        { headers: this.headers }
      );
      return response.data.status;
    } catch (error) {
      const errorResult = this.handleError(
        "Error checking training status",
        error
      );
      throw new Error(errorResult.message);
    }
  }

  async classifyText(text: string): Promise<ClassificationResult> {
    if (!this.modelId) {
      throw new Error("No model ID set. Please train or set a model first.");
    }
    try {
      // For fine-tuned models, use the "model" key (and ensure your model id already includes "-ft")
      const response = await axios.post(
        `${this.baseUrl}/classify`,
        {
          model: this.modelId, // Changed key from model_id to model
          inputs: [text],
          preset_overrides: {
            confidence_threshold: 0.5,
          },
        },
        { headers: this.headers }
      );

      if (!response.data.classifications?.[0]) {
        throw new Error("No classification result received");
      }
      const classification = response.data.classifications[0];
      return {
        prediction: classification.prediction,
        confidence: classification.confidence,
      };
    } catch (error) {
      const result = this.handleError("Error during classification", error);
      return {
        prediction: "unknown",
        confidence: 0,
        error: result.message,
      };
    }
  }

  setModelId(modelId: string) {
    if (!modelId) {
      throw new Error("Model ID cannot be empty");
    }
    this.modelId = modelId;
  }

  private handleError(context: string, error: any): CohereError {
    let errorMessage = context;
    let details = {};
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      if (axiosError.response) {
        errorMessage += `: ${
          axiosError.response.data.message || "Unknown API error"
        }`;
        details = axiosError.response.data;
      } else if (axiosError.request) {
        errorMessage += ": No response received from API";
      } else {
        errorMessage += `: ${axiosError.message}`;
      }
    } else {
      errorMessage += `: ${error.message || "Unknown error"}`;
    }
    console.error(errorMessage, details);
    return { message: errorMessage, details };
  }
}

export const createCohereClient = () => {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error("COHERE_API_KEY environment variable is not set");
  }
  return new CohereClient(apiKey);
};

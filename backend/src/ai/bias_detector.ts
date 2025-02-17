import { CohereClient } from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Cohere with your API key.
const apiKey = process.env.COHERE_API_KEY;
if (!apiKey) {
  console.error("COHERE_API_KEY is missing in .env");
}

// Create a Cohere client instance
const cohere = new CohereClient({
  token: apiKey || "",
});

export interface ClassificationResult {
  prediction: string;
  confidence: number;
  error?: string;
}

export class BiasDetector {
  private modelId: string = "";
  private initialized: boolean = false;

  // Public method to check initialization status
  public isInitialized(): boolean {
    return this.initialized;
  }

  // Use COHERE_MODEL_ID from .env if not provided.
  async initialize(
    modelId: string = process.env.COHERE_MODEL_ID || ""
  ): Promise<void> {
    if (!modelId) {
      throw new Error(
        "Please provide a model ID. Set COHERE_MODEL_ID in your .env file."
      );
    }
    this.modelId = modelId;
    this.initialized = true;
    console.log("BiasDetector initialized with model:", this.modelId);
  }

  async analyzeUtterance(utterance: string): Promise<ClassificationResult> {
    try {
      if (!this.initialized) {
        throw new Error(
          "BiasDetector not initialized. Call initialize() first."
        );
      }
      console.log("Analyzing utterance:", utterance);

      // Call the classify endpoint with the updated SDK syntax
      const response = await cohere.classify({
        inputs: [utterance],
        model: this.modelId,
        examples: [], // Optionally add classification examples if needed
      });

      console.log("Cohere API raw response:", response);

      if (
        !response ||
        !response.classifications ||
        response.classifications.length === 0
      ) {
        throw new Error("No classification result received");
      }

      const classification = response.classifications[0];
      return {
        prediction: classification.prediction ?? "unknown",
        confidence: classification.confidence ?? 0,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Error analyzing utterance:", errorMsg, err);
      return {
        prediction: "unknown",
        confidence: 0,
        error: errorMsg,
      };
    }
  }
}

// Create a singleton instance.
export const biasDetector = new BiasDetector();

// Helper function.
export const analyzeUtterance = (utterance: string) =>
  biasDetector.analyzeUtterance(utterance);

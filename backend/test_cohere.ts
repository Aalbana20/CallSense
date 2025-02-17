import { biasDetector } from "./src/ai/bias_detector";

async function main() {
  try {
    // Initialize the bias detector first
    if (!biasDetector.isInitialized()) {
      // Now using the public method
      console.log("Initializing bias detector...");
      await biasDetector.initialize();
    }

    // Test utterance
    const testUtterance = "This service is absolutely terrible!";
    console.log(`\nAnalyzing utterance: "${testUtterance}"`);

    const result = await biasDetector.analyzeUtterance(testUtterance);
    console.log("Analysis result:", result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    process.exit(1);
  }
}

main();

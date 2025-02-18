interface TrainingExample {
  text: string;
  label: "angry" | "neutral" | "positive";
}

export const trainingData: TrainingExample[] = [
  {
    text: "This is absolutely terrible service. I've been waiting for hours!",
    label: "angry",
  },
  {
    text: "I can't believe how incompetent your company is. This is ridiculous!",
    label: "angry",
  },
  {
    text: "I need to check my account balance please.",
    label: "neutral",
  },
  {
    text: "Can you tell me when my next payment is due?",
    label: "neutral",
  },
  {
    text: "Thank you so much for your help! You've made my day.",
    label: "positive",
  },
  {
    text: "I really appreciate how quickly you resolved my issue.",
    label: "positive",
  },
];

import type { FlightQuestion } from "../../../content/dataFlight";

export type FlightObjectKind = "data" | "obstacle" | "question";

export const PUBLIC_DATA_KINDS = [
  "science-technology",
  "education",
  "transport",
  "law",
  "industry",
  "medical",
  "safety",
  "environment",
] as const;

export type PublicDataKind = (typeof PUBLIC_DATA_KINDS)[number];

export type FlightQuestionPhase = "reading" | "choices";

export type ActiveFlightQuestion = {
  question: FlightQuestion;
  phase: FlightQuestionPhase;
  readingUntilMs: number;
};

export type FlightResult = Readonly<{
  completed: boolean;
  score: number;
  collected: number;
  correctAnswers: number;
  remainingHearts: number;
}>;

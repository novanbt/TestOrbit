import { MockTest, TestQuestion } from "@/types";

// Static curated question sets (empty - questions are managed via Admin Studio & Firestore)
export const CURATED_QUESTION_BANK: Record<string, TestQuestion[]> = {};

/**
 * Returns questions for a mock test.
 * Automatic question generation is disabled; questions must be created through Admin Studio.
 */
export function getQuestionsForTest(_test: MockTest): TestQuestion[] {
  return [];
}

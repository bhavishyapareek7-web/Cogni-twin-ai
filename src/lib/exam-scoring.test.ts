import { describe, expect, it } from "vitest";
import { calculateMockResult, markingForExam } from "./exam-scoring";

describe("exam marking", () => {
  it("scores CUET UG at +5 for correct and −1 for wrong answers", () => {
    const result = calculateMockResult({ exam: "CUET UG", correct: 2, wrong: 1, skipped: 0 });
    expect(result.score).toBe(9);
    expect(result.total).toBe(15);
    expect(result.accuracy).toBe(67);
    expect(markingForExam("CUET UG").label).toBe("+5 correct · −1 wrong · 0 skipped");
  });

  it("scores JEE Main at +4 for correct and −1 for wrong answers", () => {
    const result = calculateMockResult({ exam: "JEE Main", correct: 2, wrong: 1, skipped: 0 });
    expect(result.score).toBe(7);
    expect(result.total).toBe(12);
  });

  it("scores NEET UG at +4 for correct and −1 for wrong answers", () => {
    const result = calculateMockResult({ exam: "NEET UG", correct: 2, wrong: 1, skipped: 0 });
    expect(result.score).toBe(7);
    expect(result.total).toBe(12);
  });

  it("gives skipped questions zero marks without reducing accuracy", () => {
    const result = calculateMockResult({ exam: "CUET UG", correct: 1, wrong: 0, skipped: 2 });
    expect(result.score).toBe(5);
    expect(result.total).toBe(15);
    expect(result.accuracy).toBe(100);
  });
});

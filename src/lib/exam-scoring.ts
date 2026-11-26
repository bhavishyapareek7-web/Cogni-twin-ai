export type ExamMarking = {
  correctMarks: number;
  wrongMarks: number;
  label: string;
};

export function markingForExam(exam: string): ExamMarking {
  if (exam.trim().toUpperCase().includes("CUET")) {
    return { correctMarks: 5, wrongMarks: -1, label: "+5 correct · −1 wrong · 0 skipped" };
  }
  return { correctMarks: 4, wrongMarks: -1, label: "+4 correct · −1 wrong · 0 skipped" };
}

export function calculateMockResult(input: {
  exam: string;
  correct: number;
  wrong: number;
  skipped: number;
}) {
  const marking = markingForExam(input.exam);
  const attempted = input.correct + input.wrong;
  const questionCount = attempted + input.skipped;
  const total = questionCount * marking.correctMarks;
  const score = input.correct * marking.correctMarks + input.wrong * marking.wrongMarks;
  const accuracy = attempted ? Math.round((input.correct / attempted) * 100) : 0;
  const ratio = total ? Math.max(0, score) / total : 0;
  const percentile = Math.min(99.9, Math.round(ratio * 98 * 10) / 10);
  const rankLow = Math.max(1, Math.round((100 - percentile) * 1000 * 0.8));
  const rankHigh = Math.max(rankLow + 200, Math.round((100 - percentile) * 1000 * 1.25));
  return { score, total, accuracy, percentile, rankLow, rankHigh, marking };
}

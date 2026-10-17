// src/engines/deterministicGrader.ts
import { McqReferenceSolution, NumericalReferenceSolution } from '../types/assessment';

export function gradeMultipleChoice(
  studentSelection: string[],
  key: McqReferenceSolution,
  maxPoints: number
): { score: number; feedback: string } {
  const correctSet = new Set(key.correctOptionIds);
  const studentSet = new Set(studentSelection);

  if (!key.allowMultiSelect) {
    const isCorrect = studentSelection.length === 1 && correctSet.has(studentSelection[0]);
    return {
      score: isCorrect ? maxPoints : 0,
      feedback: isCorrect ? 'Correct option selected.' : 'Incorrect option selected.',
    };
  }

  // Multi-select with partial credit and false-positive penalty
  let truePositives = 0;
  let falsePositives = 0;

  for (const id of studentSet) {
    if (correctSet.has(id)) {
      truePositives++;
    } else {
      falsePositives++;
    }
  }

  const fraction = Math.max(0, (truePositives - falsePositives) / correctSet.size);
  const score = Number((fraction * maxPoints).toFixed(2));

  return {
    score,
    feedback: `Selected ${truePositives}/${correctSet.size} correct choices with ${falsePositives} incorrect selections.`,
  };
}

export function gradeNumerical(
  studentValue: number,
  key: NumericalReferenceSolution,
  maxPoints: number
): { score: number; feedback: string } {
  if (isNaN(studentValue) || studentValue === null || studentValue === undefined) {
    return { score: 0, feedback: 'No valid numerical value submitted.' };
  }

  let allowedDelta = key.toleranceValue;
  if (key.toleranceMode === 'percentage') {
    allowedDelta = Math.abs(key.targetValue * (key.toleranceValue / 100));
  }

  const delta = Math.abs(studentValue - key.targetValue);
  const isWithinTolerance = delta <= allowedDelta + 1e-9;

  return {
    score: isWithinTolerance ? maxPoints : 0,
    feedback: isWithinTolerance
      ? `Accurate answer. Within accepted margin of error ±${allowedDelta}.`
      : `Value ${studentValue} outside accepted range [${(key.targetValue - allowedDelta).toFixed(3)}, ${(key.targetValue + allowedDelta).toFixed(3)}].`,
  };
}

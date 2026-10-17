// src/engines/latePenaltyCalculator.ts
import { LatePenaltyPolicy } from '../types/assessment';

export interface LateCalculationResult {
  isLate: boolean;
  minutesLate: number;
  deductionAmount: number;
  effectivePenaltyPercentage: number;
  explanation: string;
}

export function calculateLatePenalty(
  submittedAtIso: string,
  dueDateIso: string,
  policy: LatePenaltyPolicy,
  rawScore: number
): LateCalculationResult {
  const submitTime = new Date(submittedAtIso).getTime();
  const dueTime = new Date(dueDateIso).getTime();

  if (submitTime <= dueTime) {
    return {
      isLate: false,
      minutesLate: 0,
      deductionAmount: 0,
      effectivePenaltyPercentage: 0,
      explanation: 'Submitted on time prior to deadline.',
    };
  }

  const diffMs = submitTime - dueTime;
  const minutesLate = Math.floor(diffMs / 60000);

  // Check grace period
  if (minutesLate <= (policy.gracePeriodMinutes || 0)) {
    return {
      isLate: false,
      minutesLate,
      deductionAmount: 0,
      effectivePenaltyPercentage: 0,
      explanation: `Submitted within the ${policy.gracePeriodMinutes}-minute grace period. No penalty applied.`,
    };
  }

  if (policy.ruleType === 'none' || policy.deductionRate <= 0) {
    return {
      isLate: true,
      minutesLate,
      deductionAmount: 0,
      effectivePenaltyPercentage: 0,
      explanation: 'Submitted late, but course policy has no automated deductions.',
    };
  }

  // Calculate intervals
  const intervalMs = policy.intervalUnit === 'hour' ? 3600000 : 86400000;
  const effectiveDiffMs = diffMs - (policy.gracePeriodMinutes || 0) * 60000;
  const intervalsLate = Math.max(1, Math.ceil(effectiveDiffMs / intervalMs));

  let deduction = 0;
  let penaltyPercent = 0;

  if (policy.ruleType === 'percentage') {
    const rawPenaltyPct = intervalsLate * policy.deductionRate;
    penaltyPercent = Math.min(policy.maxCapPercent, rawPenaltyPct);
    deduction = rawScore * (penaltyPercent / 100);
  } else {
    // Fixed points
    const rawPoints = intervalsLate * policy.deductionRate;
    const maxPointsDeduction = rawScore * (policy.maxCapPercent / 100);
    deduction = Math.min(rawPoints, maxPointsDeduction);
    penaltyPercent = rawScore > 0 ? (deduction / rawScore) * 100 : 0;
  }

  deduction = Math.min(rawScore, Math.max(0, Number(deduction.toFixed(2))));

  return {
    isLate: true,
    minutesLate,
    deductionAmount: deduction,
    effectivePenaltyPercentage: Number(penaltyPercent.toFixed(1)),
    explanation: `Late by ${minutesLate} minutes (${intervalsLate} ${policy.intervalUnit}s). Deducted ${deduction.toFixed(2)} pts (${penaltyPercent.toFixed(1)}% penalty cap).`,
  };
}

// src/engines/binaryEngine.ts
import { BinaryArithmeticStudentResponse, BinaryCarryAnalysis } from '../types/binary';

/**
 * Computes full ground-truth binary arithmetic with per-bit carry propagation and overflow flags
 */
export function computeBinaryAddition(
  opA: string,
  opB: string,
  bitWidth: number,
  representation: 'unsigned' | 'twos_complement'
): {
  sumBits: string;
  carryBits: string; // Length = bitWidth. carryBits[i] is carry into bit position i.
  carryOut: boolean;
  overflow: boolean;
} {
  const aPadded = opA.padStart(bitWidth, '0').slice(-bitWidth);
  const bPadded = opB.padStart(bitWidth, '0').slice(-bitWidth);

  let currentCarry = 0;
  const sumArr: number[] = new Array(bitWidth);
  const carryArr: number[] = new Array(bitWidth);

  let carryIntoMsb = 0;

  // LSB is index bitWidth - 1, MSB is index 0
  for (let i = bitWidth - 1; i >= 0; i--) {
    const bitA = parseInt(aPadded[i], 10) || 0;
    const bitB = parseInt(bPadded[i], 10) || 0;

    carryArr[i] = currentCarry;
    if (i === 0) {
      carryIntoMsb = currentCarry;
    }

    const columnSum = bitA + bitB + currentCarry;
    sumArr[i] = columnSum % 2;
    currentCarry = Math.floor(columnSum / 2);
  }

  const carryOut = currentCarry === 1;

  // Overflow calculation
  let overflow = false;
  if (representation === 'twos_complement') {
    // Two's complement overflow = carryIntoMsb XOR carryOut
    overflow = (carryIntoMsb !== currentCarry);
  } else {
    // Unsigned overflow = carry out of MSB
    overflow = carryOut;
  }

  return {
    sumBits: sumArr.join(''),
    carryBits: carryArr.join(''),
    carryOut,
    overflow,
  };
}

/**
 * Analyzes student columnar binary response, detecting the exact divergence index
 * and evaluating whether carry propagation remained logically sound afterwards.
 */
export function analyzeStudentBinarySubmission(
  student: BinaryArithmeticStudentResponse,
  expected: {
    expectedResult: string;
    expectedCarryBits: string;
    expectedCarryOutFlag: boolean;
    expectedOverflowFlag: boolean;
  }
): BinaryCarryAnalysis {
  const bitWidth = student.bitWidth;
  const studentResult = student.resultBits.join('').padStart(bitWidth, '0').slice(-bitWidth);
  const studentCarries = student.carryBits.join('').padStart(bitWidth, '0').slice(-bitWidth);

  // Exact match check
  const resultMatches = studentResult === expected.expectedResult;
  const carriesMatch = studentCarries === expected.expectedCarryBits;
  const overflowMatches = student.overflowFlag === expected.expectedOverflowFlag;
  const carryOutMatches = student.carryOutFlag === expected.expectedCarryOutFlag;

  if (resultMatches && carriesMatch && overflowMatches && carryOutMatches) {
    return {
      isFullyCorrect: true,
      divergenceIndex: null,
      propagatedCarriesCorrectly: true,
      computedCarryOut: student.carryOutFlag,
      computedOverflow: student.overflowFlag,
      expectedResult: expected.expectedResult,
      expectedCarries: expected.expectedCarryBits,
      expectedOverflow: expected.expectedOverflowFlag,
      expectedCarryOut: expected.expectedCarryOutFlag,
      partialCreditRecommended: 1.0,
      feedback: 'All bit calculations, carry propagation rows, and overflow flags are 100% accurate.',
    };
  }

  // Find divergence from LSB (bit index 0 = LSB, up to bitWidth - 1)
  let divergenceIdx: number | null = null;
  const opA = student.operands[0].padStart(bitWidth, '0').slice(-bitWidth);
  const opB = (student.operands[1] || '0').padStart(bitWidth, '0').slice(-bitWidth);

  let simulatedCarry = 0;
  let consistentPropagationAfterError = true;

  for (let pos = 0; pos < bitWidth; pos++) {
    // index in string (MSB at 0, LSB at bitWidth-1)
    const strIdx = bitWidth - 1 - pos;
    const bA = parseInt(opA[strIdx], 10) || 0;
    const bB = parseInt(opB[strIdx], 10) || 0;
    const sRes = parseInt(studentResult[strIdx], 10) || 0;
    const sCarryIn = parseInt(studentCarries[strIdx], 10) || 0;

    const correctSum = (bA + bB + simulatedCarry) % 2;
    const correctNextCarry = Math.floor((bA + bB + simulatedCarry) / 2);

    if (divergenceIdx === null) {
      if (sRes !== correctSum || sCarryIn !== simulatedCarry) {
        divergenceIdx = pos;
        // Adopt student's implied carry to check consistency on subsequent bits
        const studentNextCarry = Math.floor((bA + bB + sCarryIn) / 2);
        simulatedCarry = studentNextCarry;
      } else {
        simulatedCarry = correctNextCarry;
      }
    } else {
      // Divergence already occurred. Check if student followed standard carry rule with their own prior carry
      const studentColumnSum = (bA + bB + simulatedCarry) % 2;
      const studentNextCarry = Math.floor((bA + bB + simulatedCarry) / 2);

      if (sRes !== studentColumnSum) {
        consistentPropagationAfterError = false;
      }
      simulatedCarry = studentNextCarry;
    }
  }

  // Calculate proportional partial credit
  let scoreFraction = 0.0;
  if (resultMatches) scoreFraction += 0.4;
  if (carriesMatch) scoreFraction += 0.3;
  else if (divergenceIdx !== null && consistentPropagationAfterError) {
    // Award partial credit for consistent carry ripple after an arithmetic slip
    const correctProportion = Math.max(0.1, (bitWidth - 1) / bitWidth);
    scoreFraction += 0.25 * correctProportion;
  }
  if (overflowMatches) scoreFraction += 0.15;
  if (carryOutMatches) scoreFraction += 0.15;

  let feedback = '';
  if (divergenceIdx !== null) {
    feedback = `Arithmetic divergence occurred at bit position ${divergenceIdx} (from LSB). `;
    if (consistentPropagationAfterError) {
      feedback += 'Partial credit awarded: subsequent ripple carry logic was applied consistently despite the earlier arithmetic error.';
    } else {
      feedback += 'Subsequent carry bits also showed calculation inconsistencies.';
    }
  } else {
    feedback = 'Result matches expected arithmetic, but verify carry or overflow flag toggles.';
  }

  return {
    isFullyCorrect: false,
    divergenceIndex: divergenceIdx,
    propagatedCarriesCorrectly: consistentPropagationAfterError,
    computedCarryOut: student.carryOutFlag,
    computedOverflow: student.overflowFlag,
    expectedResult: expected.expectedResult,
    expectedCarries: expected.expectedCarryBits,
    expectedOverflow: expected.expectedOverflowFlag,
    expectedCarryOut: expected.expectedCarryOutFlag,
    partialCreditRecommended: Math.min(1.0, Math.max(0.0, scoreFraction)),
    feedback,
  };
}

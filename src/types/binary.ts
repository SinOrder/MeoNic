// src/types/binary.ts

export interface BinaryArithmeticStudentResponse {
  bitWidth: number;
  representation: 'unsigned' | 'twos_complement';
  operation: 'addition' | 'subtraction';
  operands: string[]; // e.g. ["0110", "0101"]
  carryBits: string[]; // array of strings per bit position, or single string
  resultBits: string[]; // array of bit strings
  carryOutFlag: boolean;
  overflowFlag: boolean;
}

export interface BinaryCarryAnalysis {
  isFullyCorrect: boolean;
  divergenceIndex: number | null; // Bit index where first mistake occurred (0 = LSB)
  propagatedCarriesCorrectly: boolean; // Did student correctly handle carries after divergence?
  computedCarryOut: boolean;
  computedOverflow: boolean;
  expectedResult: string;
  expectedCarries: string;
  expectedOverflow: boolean;
  expectedCarryOut: boolean;
  partialCreditRecommended: number; // 0.0 to 1.0 fraction
  feedback: string;
}

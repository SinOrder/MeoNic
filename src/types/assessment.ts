// src/types/assessment.ts

export type AccessMode = 'DIRECT' | 'LMS_GATED';

export type PartType =
  | 'multiple_choice'
  | 'descriptive'
  | 'numerical'
  | 'schematics'
  | 'diagrams'
  | 'binary_arithmetic'
  | 'karnaugh_map';

export type GradingMode = 'deterministic' | 'ai_assisted' | 'hybrid';

export interface LatePenaltyPolicy {
  ruleType: 'none' | 'percentage' | 'fixed_points';
  deductionRate: number; // e.g. 10 for 10% or 5 points
  intervalUnit: 'hour' | 'day';
  gracePeriodMinutes: number;
  maxCapPercent: number; // e.g. 50 (never deduct more than 50%)
}

export interface RubricCriterion {
  criterionId: string;
  title: string;
  description: string;
  maxPoints: number;
}

// Reference Solution Types
export interface McqOption {
  id: string;
  text: string;
}

export interface McqReferenceSolution {
  schemaType: 'mcq';
  options: McqOption[];
  correctOptionIds: string[];
  allowMultiSelect: boolean;
}

export interface NumericalReferenceSolution {
  schemaType: 'num';
  targetValue: number;
  unit?: string;
  toleranceMode: 'absolute' | 'percentage';
  toleranceValue: number;
}

export interface DescriptiveReferenceSolution {
  schemaType: 'text';
  modelAnswer: string;
  keyConcepts: string[];
}

export interface SchematexReferenceSolution {
  schemaType: 'schematex';
  sourceCode: string;
  requiredComponents?: Array<{ type: string; designator: string; value?: string }>;
  essentialConnections?: Array<[string, string]>;
}

export interface MermaidReferenceSolution {
  schemaType: 'mermaid';
  sourceCode: string;
  diagramType: 'flowchart' | 'sequenceDiagram' | 'stateDiagram-v2';
  expectedNodes?: string[];
  expectedTransitions?: Array<{ from: string; to: string; label?: string }>;
}

export interface BinaryArithmeticReferenceSolution {
  schemaType: 'binary_arithmetic';
  bitWidth: 4 | 8 | 12 | 16;
  representation: 'unsigned' | 'twos_complement';
  operation: 'addition' | 'subtraction';
  operands: string[]; // e.g. ["0110", "0101"]
  expectedResult: string; // e.g. "1011"
  expectedCarryBits: string; // e.g. "0100" (from MSB to LSB or LSB to MSB)
  expectedCarryOutFlag: boolean;
  expectedOverflowFlag: boolean;
}

export interface KMapReferenceSolution {
  schemaType: 'karnaugh_map';
  variableCount: 2 | 3 | 4;
  variables: string[]; // e.g. ["A", "B", "C", "D"]
  minterms: number[]; // e.g. [0, 2, 8, 10]
  dontCares: number[]; // e.g. [5, 7]
  expressionForm: 'SOP' | 'POS';
  canonicalExpressions: string[]; // Valid minimal simplified expressions
  essentialPrimeImplicants?: Array<{
    groupName: string;
    minterms: number[];
    implicantTerm: string;
  }>;
}

export type ReferenceSolution =
  | McqReferenceSolution
  | NumericalReferenceSolution
  | DescriptiveReferenceSolution
  | SchematexReferenceSolution
  | MermaidReferenceSolution
  | BinaryArithmeticReferenceSolution
  | KMapReferenceSolution;

export interface QuestionPart {
  partId: string;
  partIndex: number;
  partType: PartType;
  prompt: string;
  pointsMax: number;
  gradingMode: GradingMode;
  rubricCriteria: RubricCriterion[];
  referenceSolution: ReferenceSolution;
}

export interface Question {
  questionId: string;
  orderIndex: number;
  title: string;
  promptMarkdown: string;
  parts: QuestionPart[];
}

export interface Assignment {
  assignmentId: string;
  courseId?: string; // If LMS gated
  lmsCourseName?: string;
  authorId: string;
  authorName: string;
  title: string;
  instructionsMarkdown: string;
  accessMode: AccessMode;
  dueDate: string; // ISO String
  hardCutoffDate?: string;
  latePenaltyPolicy: LatePenaltyPolicy;
  isPublished: boolean;
  totalPoints: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface PortableAssignmentDraft {
  specVersion: '2.0.0';
  draftId: string;
  lastModifiedClient: string;
  cloudSync?: {
    googleDriveFileId?: string | null;
    driveRevision?: string | null;
    lastSyncedAt?: string | null;
  };
  metadata: {
    title: string;
    instructionsMarkdown: string;
    totalPoints: number;
  };
  accessControl: {
    mode: AccessMode;
    lmsCourseReference?: {
      issuer: string;
      courseId: string;
      courseTitle: string;
    } | null;
  };
  latePenaltyPolicy: LatePenaltyPolicy;
  questions: Question[];
}

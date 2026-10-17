// src/types/submission.ts

export type EvaluationType = 'deterministic' | 'ai' | 'manual_override';

export interface CriterionEvaluation {
  criterionId: string;
  criterionTitle: string;
  pointsAwarded: number;
  maxPoints: number;
  rationale: string;
}

export interface SubPartEvaluation {
  partId: string;
  scoreAwarded: number;
  maxPoints: number;
  evaluationType: EvaluationType;
  feedbackMarkdown: string;
  syntaxValid?: boolean;
  promptInjectionDetected?: boolean;
  criterionEvaluations?: CriterionEvaluation[];
  diagnostics?: {
    binaryCarryAnalysis?: any;
    kmapDiagnostics?: any;
    schematexIssues?: string[];
    mermaidIssues?: string[];
  };
  gradedAt: string;
}

export interface StudentSubmission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string; // ISO date
  isLate: boolean;
  latePenaltyDeduction: number;
  rawTotalScore: number;
  finalScore: number;
  status: 'draft' | 'submitted' | 'grading_in_progress' | 'graded';
  lmsPassbackStatus: 'not_applicable' | 'pending' | 'success' | 'failed';
  partResponses: Record<string, any>; // Keyed by partId -> student payload
  partEvaluations: Record<string, SubPartEvaluation>; // Keyed by partId
}

// src/types/kmap.ts

export type KMapCellState = '0' | '1' | 'X';

export interface KMapGroup {
  id: string;
  color: string;
  cells: number[]; // Minterm numbers (e.g., [0, 2, 8, 10])
  algebraicTerm: string; // e.g. "B'D'"
  isEssential?: boolean;
}

export interface KMapStudentResponse {
  variableCount: 2 | 3 | 4;
  variables: string[]; // e.g. ["A", "B", "C", "D"]
  gridState: Record<number, KMapCellState>; // Keyed by minterm (0-15)
  groups: KMapGroup[];
  finalSimplifiedExpression: string; // e.g. "B'D' + A'C"
  expressionForm: 'SOP' | 'POS';
}

export const GRAY_CODE_2 = [0, 1];
export const GRAY_CODE_4 = [0, 1, 3, 2];
export const GRAY_LABELS_2 = ['0', '1'];
export const GRAY_LABELS_4 = ['00', '01', '11', '10'];

export const KMAP_COLOR_PALETTE = [
  { border: '#3B82F6', fill: 'rgba(59, 130, 246, 0.22)', label: 'Blue' },
  { border: '#10B981', fill: 'rgba(16, 185, 129, 0.22)', label: 'Emerald' },
  { border: '#F59E0B', fill: 'rgba(245, 158, 11, 0.22)', label: 'Amber' },
  { border: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.22)', label: 'Purple' },
  { border: '#EC4899', fill: 'rgba(236, 72, 153, 0.22)', label: 'Pink' },
  { border: '#06B6D4', fill: 'rgba(6, 182, 212, 0.22)', label: 'Cyan' },
];

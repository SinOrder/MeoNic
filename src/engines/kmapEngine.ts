// src/engines/kmapEngine.ts
import { GRAY_CODE_4, KMapCellState, KMapGroup } from '../types/kmap';

/**
 * Maps row and column (in Gray code sequence 00, 01, 11, 10) to minterm index
 */
export function getMintermFromCoord(row: number, col: number, variableCount: 2 | 3 | 4): number {
  if (variableCount === 2) {
    // A (row: 0, 1), B (col: 0, 1)
    return (row << 1) | col;
  }
  if (variableCount === 3) {
    // A (row: 0, 1), BC (col: 0, 1, 3, 2)
    return (row << 2) | GRAY_CODE_4[col];
  }
  // 4 variables: AB (row: 0, 1, 3, 2), CD (col: 0, 1, 3, 2)
  return (GRAY_CODE_4[row] << 2) | GRAY_CODE_4[col];
}

/**
 * Returns [row, col] coordinates in Gray Code grid for a given minterm
 */
export function getCoordFromMinterm(minterm: number, variableCount: 2 | 3 | 4): [number, number] {
  if (variableCount === 2) {
    return [(minterm >> 1) & 1, minterm & 1];
  }
  if (variableCount === 3) {
    const r = (minterm >> 2) & 1;
    const cVal = minterm & 3;
    const c = GRAY_CODE_4.indexOf(cVal);
    return [r, c];
  }
  // 4 variables
  const rVal = (minterm >> 2) & 3;
  const cVal = minterm & 3;
  const r = GRAY_CODE_4.indexOf(rVal);
  const c = GRAY_CODE_4.indexOf(cVal);
  return [r, c];
}

/**
 * Validates if an array of minterms forms a valid toroidal rectangle of power-of-two size
 */
export function isValidToroidalGroup(minterms: number[], variableCount: 2 | 3 | 4): boolean {
  const size = minterms.length;
  // Size must be power of 2
  if (size <= 0 || (size & (size - 1)) !== 0) {
    return false;
  }
  if (size > (1 << variableCount)) {
    return false;
  }

  // Single cell is always a valid group
  if (size === 1) return true;

  // Verify coordinates
  const coords = minterms.map((m) => getCoordFromMinterm(m, variableCount));
  const maxRows = variableCount === 4 ? 4 : 2;
  const maxCols = variableCount === 2 ? 2 : 4;

  const rows = Array.from(new Set(coords.map((c) => c[0]))).sort((a, b) => a - b);
  const cols = Array.from(new Set(coords.map((c) => c[1]))).sort((a, b) => a - b);

  // Check row span on torus
  const rowSpanValid = isToroidalIntervalValid(rows, maxRows);
  // Check col span on torus
  const colSpanValid = isToroidalIntervalValid(cols, maxCols);

  if (!rowSpanValid || !colSpanValid) {
    return false;
  }

  // Must equal rows.length * cols.length
  return coords.length === rows.length * cols.length;
}

function isToroidalIntervalValid(indices: number[], maxDim: number): boolean {
  const len = indices.length;
  if ((len & (len - 1)) !== 0) return false; // Must be power of 2
  if (len === 1) return true;
  if (len === maxDim) return true;

  // Linear contiguous
  let isLinear = true;
  for (let i = 0; i < len - 1; i++) {
    if (indices[i + 1] - indices[i] !== 1) {
      isLinear = false;
      break;
    }
  }
  if (isLinear) return true;

  // Toroidal wrap-around check: e.g. indices [0, 3] on dimension 4
  if (maxDim === 4 && len === 2) {
    if (indices[0] === 0 && indices[1] === 3) return true;
  }

  return false;
}

/**
 * Checks for redundant groups (non-essential prime implicants).
 * A group is redundant if every '1' in it is covered by at least one other group.
 */
export function findRedundantGroups(
  groups: KMapGroup[],
  gridState: Record<number, KMapCellState>
): string[] {
  const redundantGroupIds: string[] = [];

  for (const group of groups) {
    // Only check '1' cells (ignore 'X')
    const onesInGroup = group.cells.filter((c) => gridState[c] === '1');
    if (onesInGroup.length === 0) {
      redundantGroupIds.push(group.id);
      continue;
    }

    const otherGroups = groups.filter((g) => g.id !== group.id);
    const coveredByOthers = onesInGroup.every((c) =>
      otherGroups.some((og) => og.cells.includes(c))
    );

    if (coveredByOthers) {
      redundantGroupIds.push(group.id);
    }
  }

  return redundantGroupIds;
}

/**
 * Checks for uncovered minterms that have state '1'
 */
export function findUncoveredMinterms(
  groups: KMapGroup[],
  gridState: Record<number, KMapCellState>
): number[] {
  const allCovered = new Set<number>();
  groups.forEach((g) => g.cells.forEach((c) => allCovered.add(c)));

  const uncovered: number[] = [];
  for (const [mintermStr, state] of Object.entries(gridState)) {
    const m = Number(mintermStr);
    if (state === '1' && !allCovered.has(m)) {
      uncovered.push(m);
    }
  }
  return uncovered;
}

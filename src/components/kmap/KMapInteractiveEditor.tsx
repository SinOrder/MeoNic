// src/components/kmap/KMapInteractiveEditor.tsx
import React, { useState } from 'react';
import {
  KMapStudentResponse,
  KMapCellState,
  GRAY_CODE_4,
  GRAY_LABELS_4,
  KMAP_COLOR_PALETTE,
} from '../../types/kmap';
import { getMintermFromCoord } from '../../engines/kmapEngine';
import { Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface KMapProps {
  initialState?: Partial<KMapStudentResponse>;
  onChange: (state: KMapStudentResponse) => void;
  readOnly?: boolean;
}

export const KMapInteractiveEditor: React.FC<KMapProps> = ({
  initialState,
  onChange,
  readOnly = false,
}) => {
  const [variables] = useState<string[]>(initialState?.variables || ['A', 'B', 'C', 'D']);
  const [gridState, setGridState] = useState<Record<number, KMapCellState>>(
    initialState?.gridState || Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i, '0']))
  );
  const [groups, setGroups] = useState(initialState?.groups || []);
  const [selectedMinterms, setSelectedMinterms] = useState<number[]>([]);
  const [activeTermInput, setActiveTermInput] = useState('');
  const [expression, setExpression] = useState(initialState?.finalSimplifiedExpression || '');

  // Toggle cell state: 0 -> 1 -> X -> 0
  const handleCellClick = (minterm: number) => {
    if (readOnly) return;
    const nextState: Record<KMapCellState, KMapCellState> = {
      '0': '1',
      '1': 'X',
      'X': '0',
    };
    const updatedGrid = { ...gridState, [minterm]: nextState[gridState[minterm] || '0'] };
    setGridState(updatedGrid);
    notify(updatedGrid, groups, expression);
  };

  // Toggle selection for grouping
  const handleCellSelect = (minterm: number, e: React.MouseEvent) => {
    if (readOnly || !e.shiftKey) return;
    e.preventDefault();
    setSelectedMinterms((prev) =>
      prev.includes(minterm) ? prev.filter((m) => m !== minterm) : [...prev, minterm]
    );
  };

  const handleCreateGroup = () => {
    if (selectedMinterms.length === 0) return;
    const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n > 0;
    if (!isPowerOfTwo(selectedMinterms.length)) {
      alert(`Invalid group size: ${selectedMinterms.length}. Must be a power of two (1, 2, 4, 8, 16).`);
      return;
    }

    const colorCfg = KMAP_COLOR_PALETTE[groups.length % KMAP_COLOR_PALETTE.length];
    const newGroup = {
      id: crypto.randomUUID(),
      color: colorCfg.border,
      cells: [...selectedMinterms].sort((a, b) => a - b),
      algebraicTerm: activeTermInput.trim() || `G${groups.length + 1}`,
      isEssential: true,
    };

    const nextGroups = [...groups, newGroup];
    setGroups(nextGroups);
    setSelectedMinterms([]);
    setActiveTermInput('');
    notify(gridState, nextGroups, expression);
  };

  const notify = (
    newGrid: Record<number, KMapCellState>,
    newGroups: typeof groups,
    newExpr: string
  ) => {
    onChange({
      variableCount: 4,
      variables,
      gridState: newGrid,
      groups: newGroups,
      finalSimplifiedExpression: newExpr,
      expressionForm: 'SOP',
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/90 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h4 className="font-semibold text-base text-slate-100">
            4-Variable Karnaugh Map ({variables.join('')})
          </h4>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded">
          Gray Code Order (00 &rarr; 01 &rarr; 11 &rarr; 10)
        </span>
      </div>

      <div className="text-xs text-slate-400 flex items-center justify-between">
        <span>Click a cell to cycle: <strong className="text-slate-300">0</strong> &rarr; <strong className="text-emerald-400">1</strong> &rarr; <strong className="text-amber-400">X</strong></span>
        <span>Hold <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Shift</kbd> + Click to select cells for grouping</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto py-2 flex justify-center">
        <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
          {/* Top-left corner label */}
          <div className="p-2 font-bold text-slate-400 flex items-center justify-center bg-slate-950/60 rounded border border-slate-800">
            {variables[0]}{variables[1]} \ {variables[2]}{variables[3]}
          </div>

          {/* Col headers */}
          {GRAY_LABELS_4.map((label, c) => (
            <div key={c} className="p-2 font-bold text-slate-300 bg-slate-800 rounded border border-slate-700">
              {label}
            </div>
          ))}

          {/* Map rows */}
          {GRAY_LABELS_4.map((rLabel, r) => (
            <React.Fragment key={r}>
              <div className="p-2 font-bold text-slate-300 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
                {rLabel}
              </div>
              {GRAY_LABELS_4.map((_, c) => {
                const minterm = getMintermFromCoord(r, c, 4);
                const cellVal = gridState[minterm] || '0';
                const isSelected = selectedMinterms.includes(minterm);

                // Find active group colors covering this cell
                const activeGroupsForCell = groups.filter((g) => g.cells.includes(minterm));

                return (
                  <button
                    key={minterm}
                    type="button"
                    onClick={() => handleCellClick(minterm)}
                    onClickCapture={(e) => handleCellSelect(minterm, e)}
                    className={`relative w-16 h-16 rounded-lg border transition-all flex flex-col items-center justify-center font-bold text-lg select-none ${
                      cellVal === '1'
                        ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-900/30'
                        : cellVal === 'X'
                        ? 'bg-amber-950/50 border-amber-500/70 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:border-slate-500'
                    } ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-95' : ''}`}
                  >
                    <span>{cellVal}</span>
                    <span className="absolute bottom-1 right-1.5 text-[10px] text-slate-500 font-mono font-normal">
                      m{minterm}
                    </span>

                    {/* Group Badges */}
                    {activeGroupsForCell.length > 0 && (
                      <div className="absolute top-1 left-1 flex gap-0.5">
                        {activeGroupsForCell.map((g) => (
                          <span
                            key={g.id}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: g.color }}
                            title={`In group: ${g.algebraicTerm}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Grouping Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-xs font-mono text-slate-300 font-medium">
            Selected: [{selectedMinterms.map((m) => `m${m}`).join(', ') || 'none'}]
          </span>
          <input
            type="text"
            placeholder="Algebraic Term (e.g. B'D')"
            value={activeTermInput}
            onChange={(e) => setActiveTermInput(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={selectedMinterms.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-medium text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Loop Group
          </button>
        </div>
      )}

      {/* Active Groups List */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Active Prime Implicant Groups ({groups.length}):
        </span>
        <div className="flex flex-wrap gap-2">
          {groups.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No groups formed yet. Use Shift+Click on adjacent cells to create groups.</span>
          ) : (
            groups.map((g, idx) => (
              <div
                key={g.id}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border"
                style={{ borderColor: g.color, backgroundColor: `${g.color}15` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="font-medium text-slate-200">G{idx + 1}: [{g.cells.map((c) => `m${c}`).join(', ')}]</span>
                {g.algebraicTerm && <span className="font-bold text-emerald-400">&rarr; {g.algebraicTerm}</span>}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = groups.filter((item) => item.id !== g.id);
                      setGroups(next);
                      notify(gridState, next, expression);
                    }}
                    className="text-slate-400 hover:text-red-400 ml-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Simplified Equation Input */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Final Minimal Simplified Expression (SOP Form):
        </label>
        <div className="relative">
          <input
            type="text"
            readOnly={readOnly}
            placeholder="e.g. B'D' + BD or A'C + BD"
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value);
              notify(gridState, groups, e.target.value);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
          />
          {expression.trim().length > 0 && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-3 opacity-80" />
          )}
        </div>
      </div>
    </div>
  );
};

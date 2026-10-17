// src/components/binary/BinaryScratchpad.tsx
import React, { useState, useEffect } from 'react';
import { BinaryArithmeticStudentResponse } from '../../types/binary';
import { Binary, AlertTriangle, ArrowDown } from 'lucide-react';

interface BinaryScratchpadProps {
  bitWidth?: number;
  representation?: 'unsigned' | 'twos_complement';
  operation?: 'addition' | 'subtraction';
  operands?: string[];
  initialState?: Partial<BinaryArithmeticStudentResponse>;
  onChange: (state: BinaryArithmeticStudentResponse) => void;
  readOnly?: boolean;
}

export const BinaryScratchpad: React.FC<BinaryScratchpadProps> = ({
  bitWidth = 4,
  representation = 'twos_complement',
  operation = 'addition',
  operands = ['0110', '0101'],
  initialState,
  onChange,
  readOnly = false,
}) => {
  const [carries, setCarries] = useState<string[]>(
    initialState?.carryBits || Array(bitWidth).fill('0')
  );
  const [results, setResults] = useState<string[]>(
    initialState?.resultBits || Array(bitWidth).fill('0')
  );
  const [carryOut, setCarryOut] = useState<boolean>(initialState?.carryOutFlag ?? false);
  const [overflow, setOverflow] = useState<boolean>(initialState?.overflowFlag ?? false);

  // Notify parent
  const emitChange = (
    cArr: string[],
    rArr: string[],
    cOut: boolean,
    ovf: boolean
  ) => {
    onChange({
      bitWidth,
      representation,
      operation,
      operands,
      carryBits: cArr,
      resultBits: rArr,
      carryOutFlag: cOut,
      overflowFlag: ovf,
    });
  };

  const handleCarryToggle = (index: number) => {
    if (readOnly) return;
    const next = [...carries];
    next[index] = next[index] === '1' ? '0' : '1';
    setCarries(next);
    emitChange(next, results, carryOut, overflow);
  };

  const handleResultToggle = (index: number) => {
    if (readOnly) return;
    const next = [...results];
    next[index] = next[index] === '1' ? '0' : '1';
    setResults(next);
    emitChange(carries, next, carryOut, overflow);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/90 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Binary className="w-5 h-5 text-emerald-400" />
          <h4 className="font-semibold text-base text-slate-100">
            Columnar Binary Scratchpad ({bitWidth}-bit {representation === 'twos_complement' ? "Two's Complement" : 'Unsigned'})
          </h4>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded">
          Operation: {operation === 'addition' ? 'Addition (+)' : 'Subtraction (-)'}
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Click on the <strong className="text-amber-400">Carry Bits</strong> or <strong className="text-emerald-400">Sum Bits</strong> to toggle between <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">0</kbd> and <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">1</kbd>.
      </p>

      {/* Arithmetic Column Grid */}
      <div className="flex justify-center py-2">
        <div className="font-mono text-sm inline-flex flex-col gap-1.5 p-4 bg-slate-950 rounded-xl border border-slate-800 select-none">
          {/* Bit labels (MSB to LSB) */}
          <div className="flex items-center justify-end gap-2 text-[11px] text-slate-500 pb-1 border-b border-slate-800/80">
            <span className="w-8 text-center text-slate-600 font-bold">Flag</span>
            {Array.from({ length: bitWidth }, (_, i) => {
              const bitNum = bitWidth - 1 - i;
              return (
                <span
                  key={i}
                  className={`w-10 text-center ${i === 0 && representation === 'twos_complement' ? 'text-amber-400 font-bold' : ''}`}
                >
                  {i === 0 && representation === 'twos_complement' ? 'Sign' : `b${bitNum}`}
                </span>
              );
            })}
          </div>

          {/* Carry Row */}
          <div className="flex items-center justify-end gap-2 text-xs py-1">
            <span className="w-8 text-right text-amber-500/80 font-bold">C:</span>
            {carries.map((bitVal, idx) => (
              <button
                key={idx}
                type="button"
                disabled={readOnly}
                onClick={() => handleCarryToggle(idx)}
                className={`w-10 h-7 rounded border font-bold text-xs flex items-center justify-center transition-all ${
                  bitVal === '1'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm shadow-amber-900/30'
                    : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'
                }`}
                title={`Carry into bit position ${bitWidth - 1 - idx}`}
              >
                {bitVal}
              </button>
            ))}
          </div>

          {/* Operand 1 */}
          <div className="flex items-center justify-end gap-2 text-base font-bold text-slate-200">
            <span className="w-8 text-right text-slate-500">A</span>
            {(operands[0] || '0000').split('').map((bit, idx) => (
              <span key={idx} className="w-10 text-center py-1">
                {bit}
              </span>
            ))}
          </div>

          {/* Operand 2 */}
          <div className="flex items-center justify-end gap-2 text-base font-bold text-slate-200 pb-2 border-b-2 border-slate-600">
            <span className="w-8 text-right text-emerald-400">{operation === 'addition' ? '+' : '-'}</span>
            {(operands[1] || '0000').split('').map((bit, idx) => (
              <span key={idx} className="w-10 text-center py-1">
                {bit}
              </span>
            ))}
          </div>

          {/* Result Row */}
          <div className="flex items-center justify-end gap-2 text-base font-bold pt-1">
            <span className="w-8 text-right text-emerald-400">=</span>
            {results.map((bitVal, idx) => (
              <button
                key={idx}
                type="button"
                disabled={readOnly}
                onClick={() => handleResultToggle(idx)}
                className={`w-10 h-10 rounded-lg border-2 font-bold text-base flex items-center justify-center transition-all ${
                  bitVal === '1'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {bitVal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flag Checkboxes */}
      <div className="flex flex-wrap items-center justify-center gap-6 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={carryOut}
            onChange={(e) => {
              setCarryOut(e.target.checked);
              emitChange(carries, results, e.target.checked, overflow);
            }}
            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
          />
          <span className="text-slate-300">Carry-Out Flag ($C_{'{out}'} = 1$)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={overflow}
            onChange={(e) => {
              setOverflow(e.target.checked);
              emitChange(carries, results, carryOut, e.target.checked);
            }}
            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500"
          />
          <span className="text-slate-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Signed Two's Complement Overflow Occurred
          </span>
        </label>
      </div>
    </div>
  );
};

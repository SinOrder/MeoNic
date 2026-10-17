// src/components/schematex/SchematexEditor.tsx
import React, { useMemo } from 'react';
import { parseSchematex, SchematicComponent } from '../../engines/schematexEngine';
import { Cpu, AlertCircle, Sparkles } from 'lucide-react';

interface SchematexEditorProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}

export const SchematexEditor: React.FC<SchematexEditorProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const circuit = useMemo(() => parseSchematex(value), [value]);

  const insertTemplate = (snippet: string) => {
    if (readOnly) return;
    onChange(value ? `${value}\n${snippet}` : snippet);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/90 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h4 className="font-semibold text-base text-slate-100">
            Schematex Circuit Editor & Native SVG Canvas
          </h4>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded">
          Default Schematic Engine
        </span>
      </div>

      {/* Preset Snippets */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Insert:</span>
          <button
            type="button"
            onClick={() => insertTemplate('R1 in out 10k')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            + Resistor
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('C1 out 0 1uF')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            + Capacitor
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('OP1 0 inv out OPAMP')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            + Op-Amp
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('GND 0')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            + Ground
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('AND1 inA inB out')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            + AND Gate
          </button>
        </div>
      )}

      {/* Editor & Preview Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Schematex Netlist Source:
          </label>
          <textarea
            readOnly={readOnly}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={10}
            placeholder="// Enter Schematex circuit netlist...&#10;VIN in 0 5V&#10;R1 in inv 1k&#10;RF inv out 10k&#10;OP1 0 inv out OPAMP&#10;GND 0"
            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg font-mono text-emerald-300 text-xs leading-relaxed focus:outline-none focus:border-emerald-500 shadow-inner resize-y"
          />
          {circuit.parseErrors.length > 0 && (
            <div className="flex items-start gap-2 p-2 bg-red-950/40 border border-red-800/80 rounded text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                {circuit.parseErrors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live SVG Circuit Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Live Schematic Render:</span>
            <span className="text-[11px] text-emerald-400 font-normal flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Native Vector Graphics
            </span>
          </label>
          <div className="w-full h-[230px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative flex items-center justify-center p-2 shadow-inner">
            <svg
              viewBox="0 0 500 320"
              className="w-full h-full select-none"
              style={{ background: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            >
              {/* Connecting bus line */}
              <line x1="40" y1="120" x2="460" y2="120" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />

              {/* Render Components */}
              {circuit.components.map((comp) => (
                <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
                  {comp.type === 'R' && (
                    <g>
                      <line x1="-35" y1="0" x2="-18" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
                      {/* Zigzag Resistor */}
                      <path
                        d="M -18 0 L -12 -8 L -6 8 L 0 -8 L 6 8 L 12 -8 L 18 0"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line x1="18" y1="0" x2="35" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
                      <circle cx="-35" cy="0" r="3" fill="#38bdf8" />
                      <circle cx="35" cy="0" r="3" fill="#38bdf8" />
                      <text x="0" y="-12" textAnchor="middle" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {comp.name}
                      </text>
                      <text x="0" y="20" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        {comp.value}
                      </text>
                    </g>
                  )}

                  {comp.type === 'C' && (
                    <g>
                      <line x1="-30" y1="0" x2="-8" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
                      <line x1="-8" y1="-14" x2="-8" y2="14" stroke="#10b981" strokeWidth="3" />
                      <line x1="8" y1="-14" x2="8" y2="14" stroke="#10b981" strokeWidth="3" />
                      <line x1="8" y1="0" x2="30" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
                      <circle cx="-30" cy="0" r="3" fill="#38bdf8" />
                      <circle cx="30" cy="0" r="3" fill="#38bdf8" />
                      <text x="0" y="-18" textAnchor="middle" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {comp.name}
                      </text>
                      <text x="0" y="24" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        {comp.value}
                      </text>
                    </g>
                  )}

                  {comp.type === 'OPAMP' && (
                    <g>
                      {/* Triangle body */}
                      <polygon points="-40,-35 -40,35 40,0" fill="#1e293b" stroke="#10b981" strokeWidth="2.5" />
                      {/* Inputs */}
                      <line x1="-60" y1="-18" x2="-40" y2="-18" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="-60" y1="18" x2="-40" y2="18" stroke="#38bdf8" strokeWidth="2" />
                      {/* Output */}
                      <line x1="40" y1="0" x2="60" y2="0" stroke="#38bdf8" strokeWidth="2" />
                      {/* Signs */}
                      <text x="-32" y="-14" fill="#94a3b8" fontSize="11" fontWeight="bold">-</text>
                      <text x="-32" y="22" fill="#94a3b8" fontSize="11" fontWeight="bold">+</text>
                      <text x="-5" y="4" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">
                        {comp.name}
                      </text>
                    </g>
                  )}

                  {comp.type === 'GND' && (
                    <g>
                      <line x1="0" y1="-16" x2="0" y2="0" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" strokeWidth="3" />
                      <line x1="-10" y1="6" x2="10" y2="6" stroke="#94a3b8" strokeWidth="2.5" />
                      <line x1="-4" y1="12" x2="4" y2="12" stroke="#94a3b8" strokeWidth="2" />
                      <text x="0" y="24" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                        0 (GND)
                      </text>
                    </g>
                  )}

                  {comp.type === 'V' && (
                    <g>
                      <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      <text x="0" y="-4" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">+</text>
                      <text x="0" y="10" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">-</text>
                      <line x1="0" y1="-30" x2="0" y2="-18" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="0" y1="18" x2="0" y2="30" stroke="#38bdf8" strokeWidth="2" />
                      <text x="24" y="4" fill="#f8fafc" fontSize="10" fontFamily="monospace">
                        {comp.name}
                      </text>
                    </g>
                  )}

                  {['AND', 'OR', 'NOT', 'XOR'].includes(comp.type) && (
                    <g>
                      <rect x="-25" y="-20" width="50" height="40" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">
                        {comp.name}
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {circuit.components.length === 0 && (
                <text x="250" y="160" textAnchor="middle" fill="#475569" fontSize="13" fontStyle="italic">
                  Schematic canvas is empty. Enter Schematex syntax on the left.
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

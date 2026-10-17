// src/components/diagrams/MermaidEditor.tsx
import React, { useState, useEffect } from 'react';
import { renderMermaidDiagram } from '../../engines/mermaidEngine';
import { GitBranch, AlertCircle, Sparkles } from 'lucide-react';

interface MermaidEditorProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}

export const MermaidEditor: React.FC<MermaidEditorProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      if (!value.trim()) {
        setRenderedSvg('');
        setError(null);
        return;
      }

      const res = await renderMermaidDiagram(value, 'preview');
      if (!isCancelled) {
        if (res.error) {
          setError(res.error);
        } else {
          setError(null);
          setRenderedSvg(res.svg);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  const insertTemplate = (template: string) => {
    if (readOnly) return;
    onChange(template);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/90 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-emerald-400" />
          <h4 className="font-semibold text-base text-slate-100">
            Mermaid.js Diagram Editor & Live SVG Engine
          </h4>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded">
          Flowcharts, Sequence & State Diagrams
        </span>
      </div>

      {/* Preset Snippets */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Diagram Templates:</span>
          <button
            type="button"
            onClick={() =>
              insertTemplate(`stateDiagram-v2
    [*] --> S00
    S00 --> S01: CLK
    S01 --> S11: CLK
    S11 --> S10: CLK
    S10 --> S00: CLK`)
            }
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            State Machine
          </button>
          <button
            type="button"
            onClick={() =>
              insertTemplate(`flowchart TD
    Start([Start]) --> Fetch[Fetch Instruction]
    Fetch --> Decode[Decode Opcode]
    Decode --> Execute[ALU Execute]
    Execute --> Writeback[Register Writeback]
    Writeback --> Start`)
            }
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            CPU Pipeline Flowchart
          </button>
          <button
            type="button"
            onClick={() =>
              insertTemplate(`sequenceDiagram
    autonumber
    actor User
    participant PWA as Assessment PWA
    participant IDB as IndexedDB
    participant LMS as Canvas LMS
    User->>PWA: Submit Answers
    PWA->>IDB: Buffer Outbox (Offline)
    PWA->>LMS: LTI AGS Grade Passback`)
            }
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            Sequence Diagram
          </button>
        </div>
      )}

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mermaid Syntax Input:
          </label>
          <textarea
            readOnly={readOnly}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={10}
            placeholder="Enter Mermaid diagram code..."
            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg font-mono text-emerald-300 text-xs leading-relaxed focus:outline-none focus:border-emerald-500 shadow-inner resize-y"
          />
          {error && (
            <div className="flex items-start gap-2 p-2 bg-red-950/40 border border-red-800/80 rounded text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="font-mono text-[11px] overflow-x-auto">{error}</p>
            </div>
          )}
        </div>

        {/* Live SVG Render */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Rendered Diagram:</span>
            <span className="text-[11px] text-emerald-400 font-normal flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Dynamic SVG
            </span>
          </label>
          <div className="w-full min-h-[230px] max-h-[350px] bg-slate-950 rounded-lg border border-slate-800 overflow-auto p-4 flex items-center justify-center shadow-inner">
            {renderedSvg ? (
              <div
                className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: renderedSvg }}
              />
            ) : (
              <span className="text-xs text-slate-500 italic">
                {error ? 'Diagram parsing failed.' : 'Enter valid Mermaid syntax to view rendered diagram.'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

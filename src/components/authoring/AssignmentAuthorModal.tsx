// src/components/authoring/AssignmentAuthorModal.tsx
import React, { useState } from 'react';
import { Assignment, Question, QuestionPart, PartType } from '../../types/assessment';
import { db } from '../../db/dexieDb';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  FileCode,
  Calendar,
  Clock,
  Shield,
  Layers,
  X,
} from 'lucide-react';

interface AuthorModalProps {
  initialAssignment?: Assignment;
  onClose: () => void;
  onSaved: (assignment: Assignment) => void;
}

export const AssignmentAuthorModal: React.FC<AuthorModalProps> = ({
  initialAssignment,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState(initialAssignment?.title || 'New Technical Exam');
  const [accessMode, setAccessMode] = useState<'DIRECT' | 'LMS_GATED'>(
    initialAssignment?.accessMode || 'LMS_GATED'
  );
  const [dueDate, setDueDate] = useState(
    initialAssignment?.dueDate
      ? initialAssignment.dueDate.slice(0, 16)
      : new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16)
  );
  const [lateRate, setLateRate] = useState(initialAssignment?.latePenaltyPolicy.deductionRate ?? 10);
  const [lateUnit, setLateUnit] = useState<'hour' | 'day'>(
    initialAssignment?.latePenaltyPolicy.intervalUnit || 'day'
  );
  const [gracePeriod, setGracePeriod] = useState(
    initialAssignment?.latePenaltyPolicy.gracePeriodMinutes ?? 15
  );
  const [maxCap, setMaxCap] = useState(
    initialAssignment?.latePenaltyPolicy.maxCapPercent ?? 50
  );
  const [questions, setQuestions] = useState<Question[]>(
    initialAssignment?.questions || [
      {
        questionId: 'q1',
        orderIndex: 0,
        title: 'Question 1: Combinational Circuits',
        promptMarkdown: 'Answer the following sub-parts:',
        parts: [
          {
            partId: 'q1_p1',
            partIndex: 0,
            partType: 'karnaugh_map',
            prompt: 'Optimize the given truth table using the interactive K-Map.',
            pointsMax: 20,
            gradingMode: 'hybrid',
            rubricCriteria: [
              { criterionId: 'c1', title: 'Grid Population', description: 'Accurate cells', maxPoints: 10 },
              { criterionId: 'c2', title: 'Minimal Expression', description: 'Simplified SOP', maxPoints: 10 },
            ],
            referenceSolution: {
              schemaType: 'karnaugh_map',
              variableCount: 4,
              variables: ['A', 'B', 'C', 'D'],
              minterms: [0, 2, 8, 10],
              dontCares: [],
              expressionForm: 'SOP',
              canonicalExpressions: ["B'D'"],
            },
          },
        ],
      },
    ]
  );

  // Compute total points
  const totalPoints = questions.reduce(
    (sum, q) => sum + q.parts.reduce((pSum, p) => pSum + p.pointsMax, 0),
    0
  );

  const handleAddQuestion = () => {
    const newQ: Question = {
      questionId: `q_${Date.now()}`,
      orderIndex: questions.length,
      title: `Question ${questions.length + 1}: Technical Analysis`,
      promptMarkdown: 'Complete the engineering sub-parts below.',
      parts: [
        {
          partId: `p_${Date.now()}`,
          partIndex: 0,
          partType: 'descriptive',
          prompt: 'Explain the working principle in detail.',
          pointsMax: 10,
          gradingMode: 'ai_assisted',
          rubricCriteria: [
            { criterionId: 'crit_1', title: 'Conceptual Clarity', description: 'Accurate technical vocabulary', maxPoints: 10 },
          ],
          referenceSolution: {
            schemaType: 'text',
            modelAnswer: 'Model answer.',
            keyConcepts: ['concept'],
          },
        },
      ],
    };
    setQuestions([...questions, newQ]);
  };

  const handleAddPart = (qIdx: number, type: PartType) => {
    const updated = [...questions];
    const targetQ = updated[qIdx];
    const newPart: QuestionPart = {
      partId: `p_${Date.now()}`,
      partIndex: targetQ.parts.length,
      partType: type,
      prompt: `New ${type.replace('_', ' ')} sub-part`,
      pointsMax: 10,
      gradingMode: type === 'multiple_choice' || type === 'numerical' ? 'deterministic' : 'ai_assisted',
      rubricCriteria: [
        { criterionId: `c_${Date.now()}`, title: 'Technical Accuracy', description: 'Valid implementation', maxPoints: 10 },
      ],
      referenceSolution: getDefaultReferenceForType(type),
    };
    targetQ.parts.push(newPart);
    setQuestions(updated);
  };

  const getDefaultReferenceForType = (type: PartType): any => {
    switch (type) {
      case 'multiple_choice':
        return {
          schemaType: 'mcq',
          allowMultiSelect: false,
          options: [{ id: '1', text: 'Option A' }, { id: '2', text: 'Option B' }],
          correctOptionIds: ['1'],
        };
      case 'numerical':
        return { schemaType: 'num', targetValue: 42, toleranceMode: 'absolute', toleranceValue: 0.5 };
      case 'schematics':
        return { schemaType: 'schematex', sourceCode: 'VIN in 0 5V\nR1 in out 1k\nGND 0' };
      case 'diagrams':
        return { schemaType: 'mermaid', diagramType: 'stateDiagram-v2', sourceCode: 'stateDiagram-v2\n[*] --> S0' };
      case 'binary_arithmetic':
        return {
          schemaType: 'binary_arithmetic',
          bitWidth: 4,
          representation: 'twos_complement',
          operation: 'addition',
          operands: ['0011', '0100'],
          expectedResult: '0111',
          expectedCarryBits: '0000',
          expectedCarryOutFlag: false,
          expectedOverflowFlag: false,
        };
      case 'karnaugh_map':
        return {
          schemaType: 'karnaugh_map',
          variableCount: 4,
          variables: ['A', 'B', 'C', 'D'],
          minterms: [0, 2],
          dontCares: [],
          expressionForm: 'SOP',
          canonicalExpressions: ["A'B'D'"],
        };
      default:
        return { schemaType: 'text', modelAnswer: 'Explanation', keyConcepts: ['key'] };
    }
  };

  const handleSave = async () => {
    const asg: Assignment = {
      assignmentId: initialAssignment?.assignmentId || `asg_${Date.now()}`,
      courseId: accessMode === 'LMS_GATED' ? 'crs_ee201' : undefined,
      lmsCourseName: accessMode === 'LMS_GATED' ? 'EE 201: Digital Logic & Computer Architecture' : undefined,
      authorId: 'usr_inst_001',
      authorName: 'Prof. Ada Lovelace',
      title,
      instructionsMarkdown: 'Complete all questions.',
      accessMode,
      dueDate: new Date(dueDate).toISOString(),
      latePenaltyPolicy: {
        ruleType: 'percentage',
        deductionRate: Number(lateRate),
        intervalUnit: lateUnit,
        gracePeriodMinutes: Number(gracePeriod),
        maxCapPercent: Number(maxCap),
      },
      isPublished: true,
      totalPoints,
      questions,
      createdAt: initialAssignment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.assignments.put(asg);
    onSaved(asg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Instructor Assessment Authoring</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Assessment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Access Control Mode</label>
            <select
              value={accessMode}
              onChange={(e: any) => setAccessMode(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="LMS_GATED">LMS Course-Gated (Canvas Roster Restricted)</option>
              <option value="DIRECT">Direct / Personal Access (Open to All Accounts)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Due Date & Time</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Automated Late Penalty Rule (% / interval)
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={lateRate}
                onChange={(e) => setLateRate(Number(e.target.value))}
                className="w-20 px-2 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">% per</span>
              <select
                value={lateUnit}
                onChange={(e: any) => setLateUnit(e.target.value)}
                className="px-2 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
              >
                <option value="day">Day</option>
                <option value="hour">Hour</option>
              </select>
              <span className="text-xs text-slate-400">Grace:</span>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                className="w-16 px-2 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">m</span>
            </div>
          </div>
        </div>

        {/* Questions and Sub-parts */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Composite Questions ({questions.length}) &bull; Total Points: <span className="text-emerald-400 font-mono">{totalPoints} pts</span>
            </h3>
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={q.questionId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <input
                  type="text"
                  value={q.title}
                  onChange={(e) => {
                    const next = [...questions];
                    next[qIdx].title = e.target.value;
                    setQuestions(next);
                  }}
                  className="font-bold text-sm bg-transparent border-none text-slate-100 focus:outline-none flex-1"
                />
                <button
                  onClick={() => {
                    const next = questions.filter((_, idx) => idx !== qIdx);
                    setQuestions(next);
                  }}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-parts */}
              <div className="flex flex-col gap-2 pl-2">
                {q.parts.map((p, pIdx) => (
                  <div key={p.partId} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-bold">{qIdx + 1}.{pIdx + 1}</span>
                      <span className="px-2 py-0.5 rounded uppercase font-mono text-[10px] bg-slate-800 text-slate-300">
                        {p.partType.replace('_', ' ')}
                      </span>
                      <input
                        type="text"
                        value={p.prompt}
                        onChange={(e) => {
                          const next = [...questions];
                          next[qIdx].parts[pIdx].prompt = e.target.value;
                          setQuestions(next);
                        }}
                        className="bg-transparent border-b border-slate-700 text-slate-200 px-1 py-0.5 w-64 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Pts:</span>
                      <input
                        type="number"
                        value={p.pointsMax}
                        onChange={(e) => {
                          const next = [...questions];
                          next[qIdx].parts[pIdx].pointsMax = Number(e.target.value);
                          setQuestions(next);
                        }}
                        className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-xs"
                      />
                      <button
                        onClick={() => {
                          const next = [...questions];
                          next[qIdx].parts = next[qIdx].parts.filter((_, idx) => idx !== pIdx);
                          setQuestions(next);
                        }}
                        className="text-slate-500 hover:text-red-400 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Sub-Part Dropdown Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold">+ Add Sub-part:</span>
                  {(
                    [
                      'karnaugh_map',
                      'binary_arithmetic',
                      'schematics',
                      'diagrams',
                      'multiple_choice',
                      'numerical',
                      'descriptive',
                    ] as PartType[]
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAddPart(qIdx, type)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300"
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950"
          >
            <Save className="w-4 h-4" />
            Save & Publish Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

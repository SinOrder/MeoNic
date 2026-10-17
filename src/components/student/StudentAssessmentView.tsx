// src/components/student/StudentAssessmentView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Assignment, QuestionPart } from '../../types/assessment';
import { StudentSubmission, SubPartEvaluation } from '../../types/submission';
import { UserProfile } from '../../types/auth';
import { db } from '../../db/dexieDb';
import { gradeMultipleChoice, gradeNumerical } from '../../engines/deterministicGrader';
import { evaluateSubPartWithAi } from '../../engines/aiGradingService';
import { calculateLatePenalty } from '../../engines/latePenaltyCalculator';
import { SchematexEditor } from '../schematex/SchematexEditor';
import { MermaidEditor } from '../diagrams/MermaidEditor';
import { BinaryScratchpad } from '../binary/BinaryScratchpad';
import { KMapInteractiveEditor } from '../kmap/KMapInteractiveEditor';
import { GradeReportModal } from './GradeReportModal';
import {
  Clock,
  Save,
  CheckCircle2,
  Send,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface StudentAssessmentProps {
  assignment: Assignment;
  user: UserProfile;
}

export const StudentAssessmentView: React.FC<StudentAssessmentProps> = ({
  assignment,
  user,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<StudentSubmission | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const saveTimeoutRef = useRef<any>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load existing submission draft from IndexedDB
  useEffect(() => {
    async function loadDraft() {
      const existing = await db.submissions
        .where('assignmentId')
        .equals(assignment.assignmentId)
        .first();

      if (existing) {
        setAnswers(existing.partResponses || {});
        if (existing.status === 'graded') {
          setActiveSubmission(existing);
        }
      } else {
        // Initialize defaults
        const initAnswers: Record<string, any> = {};
        assignment.questions.forEach((q) => {
          q.parts.forEach((p) => {
            if (p.partType === 'multiple_choice') initAnswers[p.partId] = [];
            else if (p.partType === 'numerical') initAnswers[p.partId] = '';
            else if (p.partType === 'descriptive') initAnswers[p.partId] = '';
            else if (p.partType === 'schematics') {
              initAnswers[p.partId] = `// Schematex input\nVIN in 0 5V\nR1 in out 10k\nGND 0`;
            } else if (p.partType === 'diagrams') {
              initAnswers[p.partId] = `stateDiagram-v2\n    [*] --> S00\n    S00 --> S01: CLK`;
            } else if (p.partType === 'binary_arithmetic') {
              initAnswers[p.partId] = {
                bitWidth: 4,
                representation: 'twos_complement',
                operation: 'addition',
                operands: ['0110', '0101'],
                carryBits: ['0', '0', '0', '0'],
                resultBits: ['0', '0', '0', '0'],
                carryOutFlag: false,
                overflowFlag: false,
              };
            } else if (p.partType === 'karnaugh_map') {
              initAnswers[p.partId] = {
                variableCount: 4,
                variables: ['A', 'B', 'C', 'D'],
                gridState: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i, '0'])),
                groups: [],
                finalSimplifiedExpression: '',
                expressionForm: 'SOP',
              };
            }
          });
        });
        setAnswers(initAnswers);
      }
    }
    loadDraft();
  }, [assignment]);

  // Debounced Autosave to IndexedDB
  const handleAnswerChange = (partId: string, val: any) => {
    const updated = { ...answers, [partId]: val };
    setAnswers(updated);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const submissionRecord: StudentSubmission = {
        submissionId: `sub_${assignment.assignmentId}_${user.userId}`,
        assignmentId: assignment.assignmentId,
        studentId: user.userId,
        studentName: user.name,
        submittedAt: new Date().toISOString(),
        isLate: false,
        latePenaltyDeduction: 0,
        rawTotalScore: 0,
        finalScore: 0,
        status: 'draft',
        lmsPassbackStatus: 'not_applicable',
        partResponses: updated,
        partEvaluations: {},
      };
      await db.submissions.put(submissionRecord);
      setLastSaved(new Date().toLocaleTimeString());
    }, 500);
  };

  // Run Hybrid Grading Pipeline upon Submission
  const handleSubmit = async () => {
    if (!window.confirm('Are you ready to submit your assessment? This will run the hybrid deterministic/AI grading pipeline.')) {
      return;
    }

    setIsSubmitting(true);
    const submittedAt = new Date().toISOString();
    const evaluations: Record<string, SubPartEvaluation> = {};
    let rawTotalScore = 0;

    // Process all sub-parts
    for (const q of assignment.questions) {
      for (const part of q.parts) {
        const studentResp = answers[part.partId];
        let subEval: SubPartEvaluation;

        if (part.partType === 'multiple_choice') {
          const res = gradeMultipleChoice(
            studentResp || [],
            part.referenceSolution as any,
            part.pointsMax
          );
          subEval = {
            partId: part.partId,
            scoreAwarded: res.score,
            maxPoints: part.pointsMax,
            evaluationType: 'deterministic',
            feedbackMarkdown: res.feedback,
            gradedAt: new Date().toISOString(),
          };
        } else if (part.partType === 'numerical') {
          const res = gradeNumerical(
            parseFloat(studentResp),
            part.referenceSolution as any,
            part.pointsMax
          );
          subEval = {
            partId: part.partId,
            scoreAwarded: res.score,
            maxPoints: part.pointsMax,
            evaluationType: 'deterministic',
            feedbackMarkdown: res.feedback,
            gradedAt: new Date().toISOString(),
          };
        } else {
          // Route to AI / Symbolic Evaluation Engine
          subEval = await evaluateSubPartWithAi({
            part,
            studentResponse: studentResp,
          });
        }

        evaluations[part.partId] = subEval;
        rawTotalScore += subEval.scoreAwarded;
      }
    }

    // Calculate Late Penalties
    const lateCalc = calculateLatePenalty(
      submittedAt,
      assignment.dueDate,
      assignment.latePenaltyPolicy,
      rawTotalScore
    );

    const finalScore = Number((rawTotalScore - lateCalc.deductionAmount).toFixed(2));

    const finalSubmission: StudentSubmission = {
      submissionId: `sub_${assignment.assignmentId}_${user.userId}`,
      assignmentId: assignment.assignmentId,
      studentId: user.userId,
      studentName: user.name,
      submittedAt,
      isLate: lateCalc.isLate,
      latePenaltyDeduction: lateCalc.deductionAmount,
      rawTotalScore: Number(rawTotalScore.toFixed(2)),
      finalScore,
      status: 'graded',
      lmsPassbackStatus: assignment.accessMode === 'LMS_GATED' ? 'success' : 'not_applicable',
      partResponses: answers,
      partEvaluations: evaluations,
    };

    // Save to IndexedDB
    await db.submissions.put(finalSubmission);
    setActiveSubmission(finalSubmission);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-6 px-4">
      {/* Assessment Header Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                {assignment.accessMode === 'LMS_GATED' ? 'Canvas LMS Gated' : 'Direct Personal Access'}
              </span>
              {assignment.lmsCourseName && (
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {assignment.lmsCourseName}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 mt-1">{assignment.title}</h1>
          </div>

          {/* Autosave and Connection Pill */}
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'PWA Online' : 'Offline Mode (Local Storage)'}
            </span>

            {lastSaved && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                Saved to IndexedDB at {lastSaved}
              </span>
            )}
          </div>
        </div>

        {/* Due Date & Late Penalty Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Due Date: {new Date(assignment.dueDate).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Late Rule: {assignment.latePenaltyPolicy.deductionRate}% per {assignment.latePenaltyPolicy.intervalUnit} (Grace: {assignment.latePenaltyPolicy.gracePeriodMinutes} mins, Cap: {assignment.latePenaltyPolicy.maxCapPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Composite Questions List */}
      <div className="flex flex-col gap-8">
        {assignment.questions.map((question, qIdx) => (
          <div
            key={question.questionId}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col gap-6"
          >
            {/* Question Title */}
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Part {qIdx + 1}
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">{question.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{question.promptMarkdown}</p>
            </div>

            {/* Sub-Parts */}
            <div className="flex flex-col gap-6">
              {question.parts.map((part, pIdx) => (
                <div
                  key={part.partId}
                  className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Sub-part {qIdx + 1}.{pIdx + 1}: {part.prompt}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      {part.pointsMax} pts
                    </span>
                  </div>

                  {/* Render based on sub-part type */}
                  {part.partType === 'multiple_choice' && (
                    <div className="flex flex-col gap-2 pt-2">
                      {(part.referenceSolution as any).options?.map((opt: any) => {
                        const isSelected = (answers[part.partId] || []).includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const current = answers[part.partId] || [];
                                const updated = e.target.checked
                                  ? [...current, opt.id]
                                  : current.filter((id: string) => id !== opt.id);
                                handleAnswerChange(part.partId, updated);
                              }}
                              className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700"
                            />
                            <span>{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {part.partType === 'descriptive' && (
                    <textarea
                      rows={5}
                      value={answers[part.partId] || ''}
                      onChange={(e) => handleAnswerChange(part.partId, e.target.value)}
                      placeholder="Type your technical explanation here..."
                      className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-sans text-slate-100 leading-relaxed focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  )}

                  {part.partType === 'numerical' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="any"
                        value={answers[part.partId] || ''}
                        onChange={(e) => handleAnswerChange(part.partId, e.target.value)}
                        placeholder="Enter numerical value..."
                        className="w-48 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                      {(part.referenceSolution as any).unit && (
                        <span className="text-xs font-mono text-slate-400 font-semibold">
                          {(part.referenceSolution as any).unit}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        (Accepted tolerance: ±{(part.referenceSolution as any).toleranceValue})
                      </span>
                    </div>
                  )}

                  {part.partType === 'schematics' && (
                    <SchematexEditor
                      value={answers[part.partId] || ''}
                      onChange={(val) => handleAnswerChange(part.partId, val)}
                    />
                  )}

                  {part.partType === 'diagrams' && (
                    <MermaidEditor
                      value={answers[part.partId] || ''}
                      onChange={(val) => handleAnswerChange(part.partId, val)}
                    />
                  )}

                  {part.partType === 'binary_arithmetic' && (
                    <BinaryScratchpad
                      bitWidth={(part.referenceSolution as any).bitWidth}
                      representation={(part.referenceSolution as any).representation}
                      operation={(part.referenceSolution as any).operation}
                      operands={(part.referenceSolution as any).operands}
                      initialState={answers[part.partId]}
                      onChange={(state) => handleAnswerChange(part.partId, state)}
                    />
                  )}

                  {part.partType === 'karnaugh_map' && (
                    <KMapInteractiveEditor
                      initialState={answers[part.partId]}
                      onChange={(state) => handleAnswerChange(part.partId, state)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button Bar */}
      <div className="sticky bottom-4 z-40 p-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-xs text-slate-300 font-medium">
            Ready to grade with our hybrid deterministic & AI pipeline?
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-950 transition"
        >
          {isSubmitting ? (
            <span>Grading Submissions...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Assessment</span>
            </>
          )}
        </button>
      </div>

      {/* Grade Report Modal */}
      {activeSubmission && (
        <GradeReportModal
          submission={activeSubmission}
          assignment={assignment}
          onClose={() => setActiveSubmission(null)}
        />
      )}
    </div>
  );
};

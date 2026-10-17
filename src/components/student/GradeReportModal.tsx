// src/components/student/GradeReportModal.tsx
import React from 'react';
import { StudentSubmission } from '../../types/submission';
import { Assignment } from '../../types/assessment';
import { Award, CheckCircle2, Clock, Cpu, FileText, Check, AlertTriangle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GradeReportProps {
  submission: StudentSubmission;
  assignment: Assignment;
  onClose: () => void;
}

export const GradeReportModal: React.FC<GradeReportProps> = ({
  submission,
  assignment,
  onClose,
}) => {
  React.useEffect(() => {
    // Launch celebratory confetti if score is high
    if (submission.finalScore / assignment.totalPoints >= 0.7) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [submission, assignment]);

  const percentage = Math.round((submission.finalScore / assignment.totalPoints) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Assessment Evaluation Report</h2>
              <p className="text-xs text-slate-400">{assignment.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Final Grade</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
              {submission.finalScore} / {assignment.totalPoints}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 font-medium">{percentage}% Overall</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Raw Score</span>
            <span className="text-2xl font-bold text-slate-200 mt-1 font-mono">
              {submission.rawTotalScore} pts
            </span>
            <span className="text-xs text-slate-500 mt-0.5">Sum of all 7 sub-parts</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Late Penalty</span>
            <span className={`text-2xl font-bold mt-1 font-mono ${submission.latePenaltyDeduction > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              -{submission.latePenaltyDeduction} pts
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              {submission.isLate ? 'Deduction applied' : 'On-time submission'}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Canvas LTI AGS</span>
            <span className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Grade Synced
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">LineItem ID: ags_201</span>
          </div>
        </div>

        {/* Detailed Breakdown per Sub-Part */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Granular Sub-Part Evaluation & Pedagogical Feedback
          </h3>

          {assignment.questions.map((q) => (
            <div key={q.questionId} className="flex flex-col gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-200">{q.title}</h4>

              <div className="flex flex-col gap-3">
                {q.parts.map((p) => {
                  const evalResult = submission.partEvaluations[p.partId];
                  if (!evalResult) return null;

                  return (
                    <div
                      key={p.partId}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                            {p.partType.replace('_', ' ')}
                          </span>
                          <span className="font-semibold text-slate-200">{p.prompt.slice(0, 75)}...</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            evalResult.evaluationType === 'deterministic'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                              : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                          }`}>
                            {evalResult.evaluationType === 'deterministic' ? 'Deterministic (0 Token)' : 'Gemini AI Pipeline'}
                          </span>
                          <span className="font-bold text-sm text-emerald-400">
                            {evalResult.scoreAwarded} / {evalResult.maxPoints} pts
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed">{evalResult.feedbackMarkdown}</p>

                      {/* Criteria breakdown */}
                      {evalResult.criterionEvaluations && evalResult.criterionEvaluations.length > 0 && (
                        <div className="mt-1 flex flex-col gap-1 border-t border-slate-800/60 pt-2">
                          <span className="text-[11px] font-semibold text-slate-400">Rubric Criteria Breakdown:</span>
                          {evalResult.criterionEvaluations.map((c) => (
                            <div key={c.criterionId} className="flex items-center justify-between text-[11px] text-slate-400 py-0.5">
                              <span>&bull; {c.criterionTitle}: <span className="text-slate-300">{c.rationale}</span></span>
                              <span className="font-mono text-slate-200 font-semibold">{c.pointsAwarded}/{c.maxPoints}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

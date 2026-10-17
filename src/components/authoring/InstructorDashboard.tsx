// src/components/authoring/InstructorDashboard.tsx
import React, { useState } from 'react';
import { Assignment } from '../../types/assessment';
import { AssignmentAuthorModal } from './AssignmentAuthorModal';
import {
  Layers,
  Plus,
  Calendar,
  Clock,
  Shield,
  FileText,
  Users,
  Edit,
  Sparkles,
} from 'lucide-react';

interface InstructorDashboardProps {
  assignments: Assignment[];
  onUpdateAssignments: (assignments: Assignment[]) => void;
  onSelectAssignmentForStudentView: (asg: Assignment) => void;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  assignments,
  onUpdateAssignments,
  onSelectAssignmentForStudentView,
}) => {
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSaved = (saved: Assignment) => {
    const exists = assignments.some((a) => a.assignmentId === saved.assignmentId);
    if (exists) {
      onUpdateAssignments(assignments.map((a) => (a.assignmentId === saved.assignmentId ? saved : a)));
    } else {
      onUpdateAssignments([saved, ...assignments]);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            Instructor Assessment Authoring & Course Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Author composite multi-part technical exams, configure automated late penalty policies, and link to university LMS course rosters.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition"
        >
          <Plus className="w-4 h-4" />
          Create New Assignment
        </button>
      </div>

      {/* Assignment List */}
      <div className="grid grid-cols-1 gap-4">
        {assignments.map((asg) => (
          <div
            key={asg.assignmentId}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  {asg.accessMode === 'LMS_GATED' ? 'Canvas LMS Gated' : 'Direct Access'}
                </span>
                {asg.lmsCourseName && (
                  <span className="text-xs text-slate-400 font-medium">
                    {asg.lmsCourseName}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{asg.title}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Due: {new Date(asg.dueDate).toLocaleDateString()} at {new Date(asg.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {asg.questions.length} Questions ({asg.questions.reduce((acc, q) => acc + q.parts.length, 0)} Sub-parts)
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {asg.totalPoints} Total Points
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditingAssignment(asg)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit / Rubrics
              </button>
              <button
                onClick={() => onSelectAssignmentForStudentView(asg)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Take as Student
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Authoring Modal */}
      {(isCreating || editingAssignment) && (
        <AssignmentAuthorModal
          initialAssignment={editingAssignment || undefined}
          onClose={() => {
            setIsCreating(false);
            setEditingAssignment(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

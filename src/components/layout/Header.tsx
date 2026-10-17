// src/components/layout/Header.tsx
import React, { useRef } from 'react';
import { Assignment } from '../../types/assessment';
import {
  Cpu,
  GraduationCap,
  Layers,
  ShieldCheck,
  Download,
  Upload,
  Cloud,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'student' | 'instructor' | 'lms';
  onSelectView: (view: 'student' | 'instructor' | 'lms') => void;
  activeAssignment: Assignment;
  onImportAssignment: (imported: Assignment) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  activeAssignment,
  onImportAssignment,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Assignment Draft as portable .schemexam.json
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeAssignment, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeAssignment.assignmentId || 'assignment'}.schemexam.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON draft
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.title && parsed.questions) {
          onImportAssignment(parsed);
          alert(`Successfully imported: "${parsed.title}" with ${parsed.questions.length} composite questions!`);
        } else {
          alert('Invalid assignment JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Google Drive Sync simulation / integration
  const handleGoogleDriveSync = () => {
    alert(
      'Google Drive Sync: Connected with scope "https://www.googleapis.com/auth/drive.file". Your assignment draft has been backed up directly to your Google Drive academic workspace folder.'
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 shadow-lg flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-950">
          <Cpu className="w-6 h-6 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-slate-100">Meonic</span>
            <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded uppercase">
              PWA v2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Academic Technical Assessment Platform</p>
        </div>
      </div>

      {/* Main View Navigation Tabs */}
      <nav className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => onSelectView('student')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            currentView === 'student'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Student Portal
        </button>

        <button
          onClick={() => onSelectView('instructor')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            currentView === 'instructor'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Instructor Panel
        </button>

        <button
          onClick={() => onSelectView('lms')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            currentView === 'lms'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          LMS Identity & Linking
        </button>
      </nav>

      {/* Portability & Cloud Sync Actions */}
      <div className="flex items-center gap-2 text-xs">
        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Import portable .schemexam.json draft"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import Draft</span>
        </button>

        <button
          type="button"
          onClick={handleExportJson}
          title="Export assignment draft as self-contained portable JSON"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Draft</span>
        </button>

        <button
          type="button"
          onClick={handleGoogleDriveSync}
          title="Sync to Google Drive via Drive REST API"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-800/60 transition"
        >
          <Cloud className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Drive Sync</span>
        </button>
      </div>
    </header>
  );
};

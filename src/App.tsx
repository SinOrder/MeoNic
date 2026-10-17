// src/App.tsx
import React, { useState, useEffect } from 'react';
import { db, seedDatabaseIfEmpty, DEFAULT_USER, DEMO_ASSIGNMENT } from './db/dexieDb';
import { Assignment } from './types/assessment';
import { UserProfile } from './types/auth';
import { Header } from './components/layout/Header';
import { StudentAssessmentView } from './components/student/StudentAssessmentView';
import { InstructorDashboard } from './components/authoring/InstructorDashboard';
import { LmsAccountManager } from './components/lms/LmsAccountManager';

export function App() {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [assignments, setAssignments] = useState<Assignment[]>([DEMO_ASSIGNMENT]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment>(DEMO_ASSIGNMENT);
  const [currentView, setCurrentView] = useState<'student' | 'instructor' | 'lms'>('student');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      await seedDatabaseIfEmpty();
      const savedUser = await db.userProfile.toCollection().first();
      if (savedUser) setUser(savedUser);

      const allAssignments = await db.assignments.toArray();
      if (allAssignments.length > 0) {
        setAssignments(allAssignments);
        setActiveAssignment(allAssignments[0]);
      }
      setIsInitialized(true);
    }
    init();
  }, []);

  const handleUpdateUser = async (updated: UserProfile) => {
    setUser(updated);
    await db.userProfile.put(updated);
  };

  const handleUpdateAssignments = async (nextList: Assignment[]) => {
    setAssignments(nextList);
    if (nextList.length > 0) {
      setActiveAssignment(nextList[0]);
    }
  };

  const handleImportAssignment = async (imported: Assignment) => {
    await db.assignments.put(imported);
    setAssignments((prev) => [imported, ...prev.filter((a) => a.assignmentId !== imported.assignmentId)]);
    setActiveAssignment(imported);
    setCurrentView('student');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm">
        Initializing Meonic Academic Storage...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        activeAssignment={activeAssignment}
        onImportAssignment={handleImportAssignment}
      />

      <main className="flex-1">
        {currentView === 'student' && (
          <StudentAssessmentView
            assignment={activeAssignment}
            user={user}
          />
        )}

        {currentView === 'instructor' && (
          <InstructorDashboard
            assignments={assignments}
            onUpdateAssignments={handleUpdateAssignments}
            onSelectAssignmentForStudentView={(asg) => {
              setActiveAssignment(asg);
              setCurrentView('student');
            }}
          />
        )}

        {currentView === 'lms' && (
          <div className="max-w-5xl mx-auto py-6 px-4">
            <LmsAccountManager user={user} onUpdateUser={handleUpdateUser} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

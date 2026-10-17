// src/components/lms/LmsAccountManager.tsx
import React, { useState } from 'react';
import { UserProfile, LinkedLmsAccount, CourseEnrollment } from '../../types/auth';
import { Link2, ShieldCheck, GraduationCap, Plus, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface LmsManagerProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export const LmsAccountManager: React.FC<LmsManagerProps> = ({ user, onUpdateUser }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [selectedLms, setSelectedLms] = useState<'canvas' | 'blackboard'>('canvas');
  const [institutionName, setInstitutionName] = useState('UC Berkeley Canvas');
  const [lmsEmail, setLmsEmail] = useState('student@berkeley.edu');

  const handleLinkNewLms = (e: React.FormEvent) => {
    e.preventDefault();
    const newLink: LinkedLmsAccount = {
      id: `lms_${Date.now()}`,
      lmsType: selectedLms,
      issuer: selectedLms === 'canvas' ? 'https://canvas.instructure.com' : 'https://blackboard.com',
      institutionName,
      lmsUserId: `usr_${Math.floor(1000 + Math.random() * 9000)}`,
      lmsEmail,
      linkedAt: new Date().toISOString(),
    };

    const newCourse: CourseEnrollment = {
      courseId: `crs_sim_${Date.now()}`,
      courseTitle: `${institutionName} - Computer Systems & Logic`,
      courseCode: 'CS61C',
      lmsType: selectedLms,
      role: 'Learner',
      status: 'active',
    };

    const updatedUser: UserProfile = {
      ...user,
      linkedLmsAccounts: [...user.linkedLmsAccounts, newLink],
      enrolledCourses: [...user.enrolledCourses, newCourse],
    };

    onUpdateUser(updatedUser);
    setIsLinking(false);
  };

  const handleUnlink = (linkId: string) => {
    const updatedUser: UserProfile = {
      ...user,
      linkedLmsAccounts: user.linkedLmsAccounts.filter((l) => l.id !== linkId),
    };
    onUpdateUser(updatedUser);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Identity & Multi-LMS Account Linking
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dual-mode authentication: link standalone personal profiles to university LMS instances (Canvas LTI 1.3 / OAuth2) for gated roster verification.
          </p>
        </div>
        <button
          onClick={() => setIsLinking(!isLinking)}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Link University LMS
        </button>
      </div>

      {/* Linking Modal / Form */}
      {isLinking && (
        <form onSubmit={handleLinkNewLms} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Connect University LMS Profile (LTI 1.3 Advantage)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase">LMS Platform</label>
              <select
                value={selectedLms}
                onChange={(e: any) => setSelectedLms(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="canvas">Canvas LMS (LTI 1.3 / OAuth2)</option>
                <option value="blackboard">Blackboard Learn (LTI 1.3)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Institution / Domain</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. Stanford University Canvas"
                className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase">University Email</label>
              <input
                type="email"
                value={lmsEmail}
                onChange={(e) => setLmsEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLinking(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
            >
              Authorize & Sync Roster
            </button>
          </div>
        </form>
      )}

      {/* Linked LMS Accounts */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Active Linked LMS Accounts ({user.linkedLmsAccounts.length}):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {user.linkedLmsAccounts.map((link) => (
            <div key={link.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {link.lmsType === 'canvas' ? 'C' : 'B'}
                </div>
                <div>
                  <h5 className="font-semibold text-sm text-slate-200">{link.institutionName}</h5>
                  <p className="text-xs text-slate-400 font-mono">{link.lmsEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  <CheckCircle className="w-3 h-3" /> Linked
                </span>
                <button
                  type="button"
                  onClick={() => handleUnlink(link.id)}
                  className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded"
                >
                  Unlink
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Course Enrollments */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          Verified Active Course Enrollments (Roster Gate Status):
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Course Code</th>
                <th className="p-3">Title</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Roster Role</th>
                <th className="p-3">Access Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {user.enrolledCourses.map((c) => (
                <tr key={c.courseId} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-300">{c.courseCode}</td>
                  <td className="p-3 text-slate-200">{c.courseTitle}</td>
                  <td className="p-3 uppercase text-slate-400">{c.lmsType}</td>
                  <td className="p-3 font-medium text-emerald-400">{c.role}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" /> Active Roster Enrolled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// src/types/auth.ts

export type SystemRole = 'instructor' | 'student' | 'admin';

export interface LinkedLmsAccount {
  id: string;
  lmsType: 'canvas' | 'blackboard' | 'brightspace' | 'moodle';
  issuer: string; // e.g., 'https://canvas.instructure.com'
  institutionName: string; // e.g. "State University"
  lmsUserId: string;
  lmsEmail: string;
  linkedAt: string;
}

export interface CourseEnrollment {
  courseId: string;
  courseTitle: string;
  courseCode: string;
  lmsType: string;
  role: 'Instructor' | 'TeachingAssistant' | 'Learner';
  status: 'active' | 'concluded';
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  systemRole: SystemRole;
  linkedLmsAccounts: LinkedLmsAccount[];
  enrolledCourses: CourseEnrollment[];
}

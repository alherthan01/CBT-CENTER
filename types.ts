
export type UserRole = 'student' | 'lecturer' | 'admin' | 'hod' | 'exam_officer';

export interface User {
  id: string;
  name: string;
  matric?: string;
  email: string;
  role: UserRole;
  faculty?: string;
  department?: string;
  level?: string;
  phone?: string;
  loginTime?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export type ExamStatus = 'draft' | 'pending' | 'live' | 'archived';

export interface Exam {
  id: string;
  code: string;
  title: string;
  faculty: string;
  department: string;
  level: string;
  duration: number; // in minutes
  questions: Question[];
  instructions: string[];
  status: ExamStatus;
  ownerId: string;
}

export interface ExamSession {
  userId: string;
  examId: string;
  answers: Record<string, number>;
  timeLeft: number;
  currentIdx: number;
  lastHeartbeat: string;
}

export interface Grade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  remark: string;
}

export interface ExamResult {
  examId: string;
  examCode: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: string;
  grade: Grade;
  submittedAt: string;
  userId: string;
  userName: string;
  matric?: string;
  session: string;
  semester: string;
  questionBreakdown: {
    question: string;
    isCorrect: boolean;
    userAnswer: number | null;
    correctAnswer: number;
    options: string[];
    marks: number;
    obtainedMarks: number;
  }[];
}

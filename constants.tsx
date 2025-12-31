
import { User, Exam } from './types';

export const COLORS = {
  primary: '#006400',
  secondary: '#FFD700',
  success: '#228B22',
  danger: '#8B0000',
  warning: '#FF8C00',
};

export const MOCK_USERS: User[] = [
  {
    id: 'aus_student_001',
    name: 'Ahmed Musa',
    matric: 'AUS/2023/CSC/001',
    email: 'ahmed.musa@student.au.edu.ng',
    role: 'student',
    faculty: 'Science',
    department: 'Computer Science',
    level: '100 Level'
  },
  {
    id: 'aus_lecturer_001',
    name: 'Dr. Ibrahim Abdullahi',
    email: 'i.abdullahi@au.edu.ng',
    role: 'lecturer',
    faculty: 'Science',
    department: 'Computer Science'
  },
  {
    id: 'aus_admin_001',
    name: 'ICT Admin',
    email: 'admin@au.edu.ng',
    role: 'admin'
  }
];

// Added MOCK_EXAMS to fix compilation error in ExamPage.tsx
export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam_csc101',
    code: 'CSC 101',
    title: 'Introduction to Computer Science',
    faculty: 'Science',
    department: 'Computer Science',
    level: '100 Level',
    duration: 60,
    status: 'live',
    ownerId: 'aus_lecturer_001',
    instructions: ['Attempt all questions', 'No calculators allowed'],
    questions: [
      {
        id: 'q1',
        text: 'What does CPU stand for?',
        options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Peripheral Unit', 'Control Processing Unit'],
        correctAnswer: 0,
        marks: 2
      },
      {
        id: 'q2',
        text: 'Which of these is an input device?',
        options: ['Monitor', 'Printer', 'Keyboard', 'Speaker'],
        correctAnswer: 2,
        marks: 2
      }
    ]
  },
  {
    id: 'exam_gst101',
    code: 'GST 101',
    title: 'Use of English I',
    faculty: 'Arts and Social Sciences',
    department: 'General Studies',
    level: '100 Level',
    duration: 45,
    status: 'live',
    ownerId: 'aus_lecturer_001',
    instructions: ['Read carefully', 'Select the best option'],
    questions: [
      {
        id: 'q3',
        text: 'Identify the noun in the sentence: "The quick brown fox jumps over the lazy dog."',
        options: ['Quick', 'Fox', 'Jumps', 'Over'],
        correctAnswer: 1,
        marks: 2
      }
    ]
  }
];

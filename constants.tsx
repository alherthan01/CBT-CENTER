
import { Exam, User } from './types';

export const COLORS = {
  primary: '#006400',
  secondary: '#FFD700',
  success: '#228B22',
  danger: '#8B0000',
  warning: '#FF8C00',
};

export const FACULTIES = {
  science: 'Faculty of Science',
  arts: 'Faculty of Arts',
  education: 'Faculty of Education',
  social_science: 'Faculty of Social Sciences',
  management: 'Faculty of Management Sciences',
};

export const MOCK_USERS: User[] = [
  {
    id: 'aus_student_001',
    name: 'Ahmed Musa',
    matric: 'AUS/2023/CSC/001',
    email: 'ahmed.musa@student.au.edu.ng',
    role: 'student',
    faculty: 'science',
    department: 'Computer Science',
    level: '100 Level',
    phone: '+2348012345678'
  },
  {
    id: 'aus_lecturer_001',
    name: 'Dr. Ibrahim Abdullahi',
    email: 'i.abdullahi@au.edu.ng',
    role: 'lecturer',
    faculty: 'science',
    department: 'Computer Science',
    phone: '+2348034567890'
  },
  {
    id: 'aus_admin_001',
    name: 'Admin Office',
    email: 'admin@au.edu.ng',
    role: 'admin',
    department: 'ICT Directorate'
  }
];

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam_csc101',
    code: 'CSC 101',
    title: 'Introduction to Computer Science',
    faculty: 'science',
    department: 'Computer Science',
    level: '100 Level',
    duration: 15,
    questions: [
      {
        id: 'q1',
        text: 'Who is known as the father of computer science?',
        options: ['Charles Babbage', 'Alan Turing', 'John von Neumann', 'Tim Berners-Lee'],
        correctAnswer: 1,
        marks: 2
      },
      {
        id: 'q2',
        text: 'Which programming language is primarily used for web development?',
        options: ['Python', 'Java', 'JavaScript', 'C++'],
        correctAnswer: 2,
        marks: 2
      },
      {
        id: 'q3',
        text: 'What does HTML stand for?',
        options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'],
        correctAnswer: 0,
        marks: 2
      },
      {
        id: 'q4',
        text: 'Which of these is a database management system?',
        options: ['MySQL', 'HTML', 'CSS', 'JavaScript'],
        correctAnswer: 0,
        marks: 2
      },
      {
        id: 'q5',
        text: 'What is the binary equivalent of decimal 15?',
        options: ['1110', '1111', '1101', '1011'],
        correctAnswer: 1,
        marks: 2
      }
    ],
    instructions: [
      'This exam contains 5 questions',
      'Each question carries 2 marks',
      'Total time: 15 minutes',
      'Ensure you answer all questions',
      'Do not refresh the page during exam'
    ]
  },
  {
    id: 'exam_mat101',
    code: 'MAT 101',
    title: 'Elementary Mathematics I',
    faculty: 'science',
    department: 'Mathematics',
    level: '100 Level',
    duration: 60,
    questions: [
      {
        id: 'q1',
        text: 'What is the value of π (pi) to two decimal places?',
        options: ['3.12', '3.14', '3.16', '3.18'],
        correctAnswer: 1,
        marks: 3
      },
      {
        id: 'q2',
        text: 'Solve for x: 2x + 5 = 17',
        options: ['x = 5', 'x = 6', 'x = 7', 'x = 8'],
        correctAnswer: 1,
        marks: 3
      }
    ],
    instructions: [
      'Answer all questions',
      'Time limit: 60 minutes',
      'Use calculator where allowed'
    ]
  }
];

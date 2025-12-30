
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Exam, ExamResult, ExamSession } from '../types';
import { MOCK_EXAMS } from '../constants';

interface ExamPageProps {
  user: User;
}

const ExamPage: React.FC<ExamPageProps> = ({ user }) => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Active');
  
  // Ref to hold state for heartbeating to avoid stale closure issues
  const stateRef = useRef({ answers, timeLeft, currentIdx });

  useEffect(() => {
    stateRef.current = { answers, timeLeft, currentIdx };
  }, [answers, timeLeft, currentIdx]);

  useEffect(() => {
    // SECURITY & RESUMPTION CHECK
    const storedResults = JSON.parse(localStorage.getItem('ausu_results') || '[]');
    const hasTaken = storedResults.some((r: ExamResult) => r.userId === user.id && r.examId === examId);
    
    if (hasTaken) {
      alert("Integrity Check: You have already submitted this examination. Re-entry is not permitted.");
      navigate('/dashboard');
      return;
    }

    // Load active sessions (simulated central DB)
    const sessions = JSON.parse(localStorage.getItem('ausu_active_sessions') || '[]');
    const existingSession = sessions.find((s: ExamSession) => s.userId === user.id && s.examId === examId);

    // Load from MOCK or localStorage (custom exams)
    const customExams = JSON.parse(localStorage.getItem('ausu_custom_exams') || '[]');
    const allExams = [...MOCK_EXAMS, ...customExams];
    const found = allExams.find(e => e.id === examId);

    if (!found) {
      navigate('/dashboard');
      return;
    }

    setExam(found);

    if (existingSession) {
      // RESUME FROM PREVIOUS STATE
      setAnswers(existingSession.answers);
      setTimeLeft(existingSession.timeLeft);
      setCurrentIdx(existingSession.currentIdx);
      setAutoSaveStatus('Session Resumed');
    } else {
      // START NEW SESSION
      setTimeLeft(found.duration * 60);
    }

    // Prompt before closing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examId, navigate, user.id]);

  // SESSION PERSISTENCE (HEARTBEAT)
  // This simulates the timer stopping and state being saved to a central proctoring DB
  useEffect(() => {
    if (!exam || isSubmitting) return;

    const heartbeatInterval = setInterval(() => {
      const sessions: ExamSession[] = JSON.parse(localStorage.getItem('ausu_active_sessions') || '[]');
      const others = sessions.filter(s => !(s.userId === user.id && s.examId === examId));
      
      const currentSession: ExamSession = {
        userId: user.id,
        examId: examId as string,
        answers: stateRef.current.answers,
        timeLeft: stateRef.current.timeLeft,
        currentIdx: stateRef.current.currentIdx,
        lastHeartbeat: new Date().toISOString()
      };

      localStorage.setItem('ausu_active_sessions', JSON.stringify([...others, currentSession]));
      setAutoSaveStatus('Synced with Proctor');
    }, 5000); // Heartbeat every 5 seconds

    return () => clearInterval(heartbeatInterval);
  }, [exam, examId, user.id, isSubmitting]);

  // COUNTDOWN TIMER
  useEffect(() => {
    if (timeLeft <= 0 && exam) {
      if (timeLeft === 0 && Object.keys(answers).length > 0) {
        handleSubmitInternal();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, exam]);

  const handleSelectOption = (qId: string, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    setAutoSaveStatus('Saving Answer...');
  };

  const calculateResults = (): ExamResult => {
    if (!exam) throw new Error("No exam context");
    
    let score = 0;
    let totalMarks = 0;
    const breakdown = exam.questions.map(q => {
      const isCorrect = answers[q.id] === q.correctAnswer;
      const obtainedMarks = isCorrect ? q.marks : 0;
      score += obtainedMarks;
      totalMarks += q.marks;
      return {
        question: q.text,
        isCorrect,
        userAnswer: answers[q.id] ?? null,
        correctAnswer: q.correctAnswer,
        options: q.options,
        marks: q.marks,
        obtainedMarks: obtainedMarks
      };
    });

    const percentage = (score / totalMarks) * 100;
    
    const settings = JSON.parse(localStorage.getItem('ausu_settings') || '{}');

    const grade = (p: number) => {
      if (p >= 70) return { grade: 'A', remark: 'Excellent' } as const;
      if (p >= 60) return { grade: 'B', remark: 'Very Good' } as const;
      if (p >= 50) return { grade: 'C', remark: 'Good' } as const;
      if (p >= 45) return { grade: 'D', remark: 'Pass' } as const;
      return { grade: 'F', remark: 'Fail' } as const;
    };

    return {
      examId: exam.id,
      examCode: exam.code,
      examTitle: exam.title,
      score,
      totalMarks,
      percentage: percentage.toFixed(2),
      grade: grade(percentage),
      submittedAt: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      matric: user.matric,
      session: settings.session || '2023/2024',
      semester: settings.semester || 'Second Semester',
      questionBreakdown: breakdown
    };
  };

  const handleSubmitInternal = async () => {
    setShowFinalConfirmation(false);
    setIsSubmitting(true);
    const result = calculateResults();
    
    // 1. CLEAR ACTIVE SESSION
    const sessions: ExamSession[] = JSON.parse(localStorage.getItem('ausu_active_sessions') || '[]');
    const remainingSessions = sessions.filter(s => !(s.userId === user.id && s.examId === examId));
    localStorage.setItem('ausu_active_sessions', JSON.stringify(remainingSessions));

    // 2. Persist to results store
    const existing = JSON.parse(localStorage.getItem('ausu_results') || '[]');
    existing.push(result);
    localStorage.setItem('ausu_results', JSON.stringify(existing));

    setTimeout(() => {
      navigate('/results');
    }, 1500);
  };

  const openConfirmation = () => {
    setShowFinalConfirmation(true);
  };

  if (!exam) return null;

  const currentQuestion = exam.questions[currentIdx];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (Object.keys(answers).length / exam.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam.questions.length;
  const unansweredCount = totalQuestions - answeredCount;

  const getTimerStyles = () => {
    if (timeLeft < 300) {
      return "bg-red-600 text-white animate-pulse shadow-xl shadow-red-200";
    }
    return "bg-gray-900 text-white";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* FINAL CONFIRMATION MODAL */}
      {showFinalConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="ausu-gradient h-3 w-full"></div>
            <div className="p-8">
              <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-yellow-100">
                <span className="text-3xl">📝</span>
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 text-center mb-4">Final Submission Check</h3>
              
              <div className="bg-gray-50 rounded-2xl p-6 mb-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Answered</span>
                  <span className="font-black text-green-700">{answeredCount} Questions</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Unanswered</span>
                  <span className={`font-black ${unansweredCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{unansweredCount} Questions</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Time Left</span>
                  <span className="font-black text-gray-800">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                <p className="text-sm font-medium text-blue-900 leading-relaxed italic">
                  "I confirm that I have reviewed my answers and I am ready to submit my examination for grading at Al'Istiqama University Sumaila. I certify that this work is my own and complies with the university's code of academic integrity."
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSubmitInternal}
                  className="w-full py-4 ausu-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
                >
                  Finalize & Submit Exam
                </button>
                <button 
                  onClick={() => setShowFinalConfirmation(false)}
                  className="w-full py-4 bg-white text-gray-500 hover:bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  Go Back to Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSubmitting ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-2xl shadow-xl border-4 border-green-800">
          <div className="w-20 h-20 border-8 border-green-100 border-t-green-800 rounded-full animate-spin"></div>
          <div>
            <h2 className="text-3xl font-black text-green-900">Processing Submission</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-2">Uploading scripts to AUSU Mainframe...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-20 z-40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center sm:items-start">
              <h2 className="text-xl font-black text-green-900 leading-tight">{exam.code}: {exam.title}</h2>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.name} • {user.matric}</div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-6 py-3 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${getTimerStyles()}`}>
                <div className="text-2xl font-black font-mono leading-none">{formatTime(timeLeft)}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-75">Time Remaining</div>
              </div>
              
              <button 
                onClick={openConfirmation}
                className="hidden sm:flex bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-2 border-red-200 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* EMERGENCY SYSTEM NOTICE */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black text-yellow-800 uppercase tracking-wider">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>
              State Resumption Protocol Active
            </div>
            <div className="text-[9px] text-yellow-600 font-bold italic">Progress is heartbeating to central proctor server every 5s</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-green-100 w-full">
                  <div className="h-full bg-green-800 transition-all duration-500" style={{ width: `${((currentIdx + 1) / exam.questions.length) * 100}%` }}></div>
                </div>
                
                <div className="mb-8">
                  <span className="text-xs font-black text-green-800 uppercase tracking-widest mb-2 block">Question {currentIdx + 1} of {exam.questions.length}</span>
                  <h3 className="text-2xl font-bold text-gray-800 leading-relaxed">{currentQuestion.text}</h3>
                </div>

                <div className="space-y-4">
                  {currentQuestion.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(currentQuestion.id, i)}
                      className={`w-full p-5 rounded-2xl text-left font-bold transition-all border-2 flex items-center gap-4 group ${
                        answers[currentQuestion.id] === i 
                          ? 'bg-green-50 border-green-800 text-green-900 ring-4 ring-green-100' 
                          : 'bg-white border-gray-50 text-gray-700 hover:border-green-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                        answers[currentQuestion.id] === i 
                        ? 'bg-green-800 border-green-800 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:bg-green-100 group-hover:border-green-200 group-hover:text-green-800'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-lg">{option}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-50">
                  <button 
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => prev - 1)}
                    className="px-6 py-3 rounded-xl font-bold border-2 border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all disabled:opacity-30 flex items-center gap-2"
                  >
                    <span>←</span> Previous
                  </button>
                  
                  {currentIdx === exam.questions.length - 1 ? (
                    <button 
                      onClick={openConfirmation}
                      className="px-10 py-3 rounded-xl font-bold bg-green-800 text-white hover:bg-green-900 shadow-xl shadow-green-200 active:scale-95 transition-all flex items-center gap-2"
                    >
                      Final Submission <span>🚀</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setCurrentIdx(prev => prev + 1)}
                      className="px-10 py-3 rounded-xl font-bold ausu-gradient text-white shadow-xl shadow-green-200 active:scale-95 transition-all flex items-center gap-2"
                    >
                      Next Question <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Question Navigator</h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-2 mb-6">
                  {exam.questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(i)}
                      className={`h-10 w-full rounded-lg font-bold text-xs transition-all border-2 ${
                        currentIdx === i ? 'bg-green-800 text-white border-green-800 scale-110 z-10' :
                        answers[q.id] !== undefined ? 'bg-green-100 text-green-800 border-green-200' :
                        'bg-gray-50 text-gray-400 border-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={openConfirmation}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-red-100 active:scale-95 flex items-center justify-center gap-2"
                >
                  🏁 Finish & Submit
                </button>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl shadow-sm text-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Completion</span>
                  <span className="text-xs font-black text-green-400">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Auto-save</span>
                  <span className="text-[10px] font-black text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    {autoSaveStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamPage;

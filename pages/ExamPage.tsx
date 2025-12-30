
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Exam, ExamResult, ExamSession, Grade } from '../types';
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
  
  const stateRef = useRef({ answers, timeLeft, currentIdx });

  useEffect(() => {
    stateRef.current = { answers, timeLeft, currentIdx };
  }, [answers, timeLeft, currentIdx]);

  useEffect(() => {
    // 1. GLOBAL ACCESS CHECK
    const settings = JSON.parse(localStorage.getItem('ausu_settings') || '{}');
    if (settings.examAvailability === false && user.role === 'student') {
      alert("Access Denied: The portal is currently locked by the administrator.");
      navigate('/dashboard');
      return;
    }

    // 2. INTEGRITY CHECK
    const storedResults = JSON.parse(localStorage.getItem('ausu_results') || '[]');
    const hasTaken = storedResults.some((r: ExamResult) => r.userId === user.id && r.examId === examId);
    if (hasTaken) {
      alert("Integrity Violation: Multiple attempts are not permitted.");
      navigate('/dashboard');
      return;
    }

    // 3. LOAD DATA
    const sessions = JSON.parse(localStorage.getItem('ausu_active_sessions') || '[]');
    const existingSession = sessions.find((s: ExamSession) => s.userId === user.id && s.examId === examId);
    const customExams = JSON.parse(localStorage.getItem('ausu_custom_exams') || '[]');
    const allExams = [...MOCK_EXAMS, ...customExams];
    const found = allExams.find(e => e.id === examId);

    if (!found) {
      navigate('/dashboard');
      return;
    }

    setExam(found);

    if (existingSession) {
      setAnswers(existingSession.answers);
      setTimeLeft(existingSession.timeLeft);
      setCurrentIdx(existingSession.currentIdx);
    } else {
      setTimeLeft(found.duration * 60);
    }

    const preventRefresh = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', preventRefresh);
    return () => window.removeEventListener('beforeunload', preventRefresh);
  }, [examId, navigate, user.id, user.role]);

  useEffect(() => {
    if (!exam || isSubmitting) return;
    const saveInterval = setInterval(() => {
      const sessions: ExamSession[] = JSON.parse(localStorage.getItem('ausu_active_sessions') || '[]');
      const others = sessions.filter(s => !(s.userId === user.id && s.examId === examId));
      const current: ExamSession = {
        userId: user.id,
        examId: examId as string,
        answers: stateRef.current.answers,
        timeLeft: stateRef.current.timeLeft,
        currentIdx: stateRef.current.currentIdx,
        lastHeartbeat: new Date().toISOString()
      };
      localStorage.setItem('ausu_active_sessions', JSON.stringify([...others, current]));
      setAutoSaveStatus('Synced');
      setTimeout(() => setAutoSaveStatus('Active'), 1000);
    }, 10000);
    return () => clearInterval(saveInterval);
  }, [exam, examId, user.id, isSubmitting]);

  useEffect(() => {
    if (timeLeft <= 0 && exam) {
      if (!isSubmitting) handleSubmitInternal();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, exam, isSubmitting]);

  const handleSubmitInternal = async () => {
    setIsSubmitting(true);
    let score = 0;
    let totalMarks = 0;
    
    const breakdown = exam!.questions.map(q => {
      const correct = answers[q.id] === q.correctAnswer;
      score += correct ? q.marks : 0;
      totalMarks += q.marks;
      return {
        question: q.text,
        isCorrect: correct,
        userAnswer: answers[q.id] ?? null,
        correctAnswer: q.correctAnswer,
        options: q.options,
        marks: q.marks,
        obtainedMarks: correct ? q.marks : 0
      };
    });

    const percentage = (score / totalMarks) * 100;
    const grade = (p: number): Grade => {
      if (p >= 70) return { grade: 'A', remark: 'Excellent' };
      if (p >= 60) return { grade: 'B', remark: 'Very Good' };
      if (p >= 50) return { grade: 'C', remark: 'Good' };
      if (p >= 45) return { grade: 'D', remark: 'Pass' };
      return { grade: 'F', remark: 'Fail' };
    };

    const result: ExamResult = {
      examId: exam!.id, examCode: exam!.code, examTitle: exam!.title,
      score, totalMarks, percentage: percentage.toFixed(2),
      grade: grade(percentage), submittedAt: new Date().toISOString(),
      userId: user.id, userName: user.name, matric: user.matric,
      session: '2023/2024', semester: 'Second Semester',
      questionBreakdown: breakdown
    };

    const results = JSON.parse(localStorage.getItem('ausu_results') || '[]');
    results.push(result);
    localStorage.setItem('ausu_results', JSON.stringify(results));
    
    const sessions = JSON.parse(localStorage.getItem('ausu_active_sessions') || '[]');
    localStorage.setItem('ausu_active_sessions', JSON.stringify(sessions.filter((s: any) => !(s.userId === user.id && s.examId === examId))));
    
    setTimeout(() => navigate('/results'), 1500);
  };

  if (!exam) return null;

  const q = exam.questions[currentIdx];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {showFinalConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-scaleIn">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-2xl font-black mb-4">Submit Assessment?</h3>
            <p className="text-gray-500 mb-8 text-sm">Once submitted, you cannot change your answers. Are you ready?</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleSubmitInternal} className="w-full py-4 ausu-gradient text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Finalize Submission</button>
              <button onClick={() => setShowFinalConfirmation(false)} className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs">Return to Exam</button>
            </div>
          </div>
        </div>
      )}

      {isSubmitting ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-3xl shadow-xl border-4 border-green-800">
          <div className="w-16 h-16 border-8 border-green-100 border-t-green-800 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-black text-green-950 uppercase tracking-tighter">Securing Submission</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Communicating with AUSU Academic Cloud...</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center sticky top-20 z-40">
            <div>
              <h2 className="text-xl font-black text-green-900 leading-none">{exam.code}: {exam.title}</h2>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{user.name} • {formatTime(timeLeft)} remaining</div>
            </div>
            <div className="px-6 py-3 bg-gray-900 text-white rounded-2xl flex flex-col items-center shadow-lg ring-4 ring-gray-100">
               <div className="text-2xl font-black font-mono leading-none">{formatTime(timeLeft)}</div>
               <div className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Timer</div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 h-1 bg-green-800" style={{ width: `${((currentIdx + 1) / exam.questions.length) * 100}%` }}></div>
             <div className="mb-8">
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 block">Question {currentIdx + 1} of {exam.questions.length}</span>
                <h3 className="text-2xl font-bold text-gray-800 leading-relaxed">{q.text}</h3>
             </div>
             <div className="space-y-4">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => setAnswers({...answers, [q.id]: i})} className={`w-full p-6 rounded-2xl text-left font-bold transition-all border-2 flex items-center gap-4 ${answers[q.id] === i ? 'bg-green-50 border-green-800 text-green-900 ring-4 ring-green-100' : 'bg-white border-gray-100 text-gray-600 hover:border-green-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${answers[q.id] === i ? 'bg-green-800 border-green-800 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>{String.fromCharCode(65+i)}</div>
                    <span className="text-lg">{opt}</span>
                  </button>
                ))}
             </div>
             <div className="mt-12 pt-8 border-t border-gray-50 flex justify-between items-center">
                <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-6 py-3 font-bold text-gray-400 disabled:opacity-20 transition-all">← Back</button>
                <div className="flex gap-4">
                   {currentIdx === exam.questions.length - 1 
                     ? <button onClick={() => setShowFinalConfirmation(true)} className="px-10 py-4 bg-green-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Submit Now</button>
                     : <button onClick={() => setCurrentIdx(prev => prev + 1)} className="px-10 py-4 ausu-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Next Step →</button>
                   }
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {exam.questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIdx(i)} className={`h-10 rounded-lg font-black text-xs transition-all border-2 ${currentIdx === i ? 'border-green-800 bg-green-800 text-white' : answers[exam.questions[i].id] !== undefined ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-50 text-gray-300'}`}>{i + 1}</button>
                ))}
             </div>
             <div className="mt-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-t border-gray-50 pt-6">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {autoSaveStatus}</div>
                <div>AUSU CBT Mainframe v3.0</div>
             </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default ExamPage;

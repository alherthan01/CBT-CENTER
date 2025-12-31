
import React, { useState, useEffect } from 'react';
import { ExamResult } from '../types';
import { explainQuestion, generateStudyPlan } from '../services/geminiService';

interface ResultsPageProps {
  user: any;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ user }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [activeExplainId, setActiveExplainId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('ausu_results') || '[]');
    const userResults = stored.filter((r: ExamResult) => r.userId === user.id).reverse();
    setResults(userResults);
  }, [user.id]);

  const viewResultDetails = (index: number) => {
    setSelectedResultIndex(index);
    setExplanation(null);
    setStudyPlan(null);
    setActiveExplainId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExplain = async (qIdx: number) => {
    if (selectedResultIndex === null) return;
    
    setActiveExplainId(qIdx);
    setExplanation(null);
    setIsExplaining(true);
    
    const res = results[selectedResultIndex];
    const breakdown = res.questionBreakdown[qIdx];
    
    try {
      const text = await explainQuestion(breakdown.question, breakdown.options, breakdown.correctAnswer);
      setExplanation(text || "Could not generate explanation.");
    } catch (err) {
      setExplanation("An error occurred while generating the explanation.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleStudyPlan = async () => {
    if (selectedResultIndex === null) return;
    
    setIsGeneratingPlan(true);
    setStudyPlan(null);
    const res = results[selectedResultIndex];
    
    try {
      const plan = await generateStudyPlan(res);
      setStudyPlan(plan || "Could not generate plan.");
    } catch (err) {
      setStudyPlan("An error occurred while generating your study plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const scrollToQuestion = (idx: number) => {
    const element = document.getElementById(`question-${idx}`);
    if (element) {
      const offset = 140; // Navbar + Sticky Nav height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const getLetter = (idx: number | null) => idx !== null ? String.fromCharCode(65 + idx) : 'N/A';

  if (results.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 animate-fadeIn">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-2xl font-black text-gray-800">No results found</h2>
        <p className="text-gray-500 font-medium">Take an examination to see your academic progress here.</p>
      </div>
    );
  }

  // --- LIST VIEW ---
  if (selectedResultIndex === null) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-3xl font-black text-green-900 mb-2 flex items-center gap-3">
            <span className="text-4xl">🏅</span> Academic Performance
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">History of all taken examinations</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {results.map((res, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow">
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{res.examCode}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{res.session} Session</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{res.examTitle}</h3>
                <p className="text-xs text-gray-500 mt-1">Submitted on {new Date(res.submittedAt).toLocaleDateString()} at {new Date(res.submittedAt).toLocaleTimeString()}</p>
              </div>
              
              <div className="flex items-center gap-8 px-6 border-l border-gray-100">
                <div className="text-center">
                  <div className={`text-2xl font-black ${parseFloat(res.percentage) >= 50 ? 'text-green-700' : 'text-red-600'}`}>
                    {res.percentage}%
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-800">{res.grade.grade}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grade</div>
                </div>
                <button 
                  onClick={() => viewResultDetails(idx)}
                  className="bg-green-800 hover:bg-green-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- DETAILED VIEW ---
  const res = results[selectedResultIndex];

  return (
    <div className="space-y-8 animate-fadeIn pb-20 relative">
      {/* Sticky Navigation Bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b-2 border-green-800 shadow-md -mx-4 px-4 py-3 mb-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-4">
          <button 
            onClick={() => setSelectedResultIndex(null)}
            className="flex items-center gap-2 text-xs font-black text-green-800 uppercase tracking-widest hover:bg-green-50 px-4 py-2 rounded-xl transition-all shrink-0"
          >
            <span>←</span> Back to All Results
          </button>
          <div className="flex-grow flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2 whitespace-nowrap">Jump to Question:</span>
            {res.questionBreakdown.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToQuestion(idx)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border-2 transition-all shrink-0 ${
                  res.questionBreakdown[idx].isCorrect 
                    ? 'border-green-100 bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'border-red-100 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-gray-100">
            <div className="text-right">
              <div className="text-xs font-black text-gray-900 leading-none">{res.percentage}%</div>
              <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border-t-8 border-green-800 overflow-hidden ring-1 ring-gray-100">
        {/* Header Summary */}
        <div className="p-8 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-8 border-b border-gray-100">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-800 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase">{res.examCode}</span>
              <span className="text-xs font-bold text-gray-400">{res.session} • {res.semester}</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900">{res.examTitle}</h3>
            <div className="flex flex-wrap gap-4 mt-3">
               <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                <span className="text-gray-400">Submission Date:</span> {new Date(res.submittedAt).toLocaleString()}
              </div>
              <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                <span className="text-gray-400">Candidate:</span> {res.userName} ({res.matric})
              </div>
            </div>
          </div>
          <div className="text-center bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex items-center gap-8 px-10">
            <div className="text-center">
              <div className="text-5xl font-black text-green-800 leading-none">{res.percentage}%</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Final Percentage</div>
            </div>
            <div className="w-px h-12 bg-gray-100"></div>
            <div className="text-center">
              <div className={`text-5xl font-black leading-none ${res.grade.grade === 'F' ? 'text-red-600' : 'text-yellow-600'}`}>{res.grade.grade}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Overall Grade</div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Question Breakdown & Marks Summary</h4>
            <div className="bg-green-50 text-green-800 text-xs font-bold px-4 py-1 rounded-full border border-green-100">
              Total Points: {res.score} / {res.totalMarks}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {res.questionBreakdown.map((q, qIdx) => (
              <div 
                key={qIdx} 
                id={`question-${qIdx}`}
                className={`p-8 rounded-3xl border-2 transition-all group scroll-mt-32 ${q.isCorrect ? 'bg-green-50/20 border-green-100' : 'bg-red-50/20 border-red-100'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {q.isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {q.obtainedMarks} / {q.marks} Marks
                  </div>
                </div>
                
                <h5 className="font-bold text-gray-800 mb-6 leading-relaxed">
                  <span className="text-gray-400 mr-2">{qIdx + 1}.</span> {q.question}
                </h5>

                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                    const isUserChoice = q.userAnswer === oIdx;
                    const isCorrectChoice = q.correctAnswer === oIdx;
                    
                    let statusClasses = 'bg-gray-50 border-gray-100 text-gray-400';
                    if (isCorrectChoice) statusClasses = 'bg-green-100 border-green-200 text-green-800 ring-2 ring-green-50';
                    else if (isUserChoice) statusClasses = 'bg-red-100 border-red-200 text-red-800 ring-2 ring-red-50';

                    return (
                      <div key={oIdx} className={`p-4 rounded-2xl border-2 text-xs font-bold flex items-center gap-4 transition-all ${statusClasses}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          isCorrectChoice ? 'bg-green-800 border-green-800 text-white' : 
                          isUserChoice ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-100 text-gray-300'
                        }`}>
                          {getLetter(oIdx)}
                        </div>
                        <span className="flex-grow">{opt}</span>
                        {isCorrectChoice && <span className="text-green-600 text-lg">✓</span>}
                        {isUserChoice && !isCorrectChoice && <span className="text-red-600 text-lg">✕</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  {activeExplainId === qIdx ? (
                    <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-sm animate-fadeIn relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-900 text-white rounded-xl flex items-center justify-center text-xs">AI</div>
                        <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Academic Tutor Insight</span>
                      </div>
                      {isExplaining ? (
                        <div className="flex flex-col gap-2">
                          <div className="h-2 w-3/4 bg-blue-50 rounded animate-pulse"></div>
                          <div className="h-2 w-1/2 bg-blue-50 rounded animate-pulse"></div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 leading-relaxed font-medium italic">
                          "{explanation}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleExplain(qIdx)}
                      className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest transition-all group"
                    >
                      <span className="group-hover:rotate-12 transition-transform">✨</span> Analyze Answer with Gemini
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AI Study Plan Section */}
          <div className="mt-16 bg-green-950 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 right-10 w-96 h-96 bg-green-500 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-yellow-500 rounded-full blur-[120px]"></div>
             </div>
             
             <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-800 rounded-[2rem] flex items-center justify-center text-3xl mb-6 shadow-2xl border border-green-700">📚</div>
                <h3 className="text-3xl font-black mb-2 italic">Personalized AI Study Plan</h3>
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-10">Based on your performance in {res.examCode}</p>
                
                {!studyPlan ? (
                  <button 
                    onClick={handleStudyPlan}
                    disabled={isGeneratingPlan}
                    className="group relative px-12 py-5 bg-white text-green-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isGeneratingPlan ? (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-green-950 border-t-transparent rounded-full animate-spin"></div>
                        Generating Strategy...
                      </div>
                    ) : (
                      'Initialize Study Plan ✨'
                    )}
                  </button>
                ) : (
                  <div className="w-full text-left bg-green-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-green-800/50 animate-fadeIn">
                     <div className="text-xs font-black text-green-300 uppercase tracking-widest mb-6 border-b border-green-800 pb-4 flex justify-between">
                        <span>Academic Recommendations</span>
                        <button onClick={() => setStudyPlan(null)} className="hover:text-white">✕ Clear</button>
                     </div>
                     <div className="prose prose-invert max-w-none">
                        <p className="text-green-50 text-sm leading-relaxed whitespace-pre-wrap">{studyPlan}</p>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;

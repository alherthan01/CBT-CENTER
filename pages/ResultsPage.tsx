
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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    
    const res = results[selectedResultIndex];
    const breakdown = res.questionBreakdown[qIdx];
    
    const text = await explainQuestion(breakdown.question, breakdown.options, breakdown.correctAnswer);
    setExplanation(text || "Could not generate explanation.");
    setLoading(false);
  };

  const handleStudyPlan = async () => {
    if (selectedResultIndex === null) return;
    
    setLoading(true);
    const res = results[selectedResultIndex];
    const plan = await generateStudyPlan(res);
    setStudyPlan(plan || "Could not generate plan.");
    setLoading(false);
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
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setSelectedResultIndex(null)}
          className="flex items-center gap-2 text-sm font-bold text-green-800 hover:text-green-950 transition-colors"
        >
          <span>←</span> Back to All Results
        </button>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detailed Examination Report</div>
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
              <div key={qIdx} className={`p-8 rounded-3xl border-2 transition-all group ${q.isCorrect ? 'bg-green-50/20 border-green-100' : 'bg-red-50/20 border-red-100'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-black">
                      {qIdx + 1}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm ${q.isCorrect ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                      {q.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-gray-800">{q.obtainedMarks} / {q.marks}</div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Marks Obtained</div>
                  </div>
                </div>

                <p className="font-bold text-gray-900 leading-relaxed text-lg mb-6">{q.question}</p>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className={`p-4 rounded-xl border flex justify-between items-center bg-white ${q.isCorrect ? 'border-green-200' : 'border-red-100'}`}>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Your Selection</span>
                      <span className={`font-bold ${!q.isCorrect ? 'text-red-600' : 'text-green-800'}`}>
                        {getLetter(q.userAnswer)}: {q.userAnswer !== null ? q.options[q.userAnswer] : 'No Answer Provided'}
                      </span>
                    </div>
                    {q.isCorrect ? <span className="text-xl">✅</span> : <span className="text-xl">❌</span>}
                  </div>

                  {!q.isCorrect && (
                    <div className="p-4 rounded-xl border border-green-200 bg-white flex justify-between items-center shadow-sm">
                      <div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest block mb-1">Correct Answer</span>
                        <span className="font-bold text-green-900">
                          {getLetter(q.correctAnswer)}: {q.options[q.correctAnswer]}
                        </span>
                      </div>
                      <span className="text-xl">⭐</span>
                    </div>
                  )}
                </div>

                {!q.isCorrect && (
                  <button 
                    onClick={() => handleExplain(qIdx)}
                    className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-1 group-hover:scale-105 transition-transform"
                  >
                    Ask AI Tutor for Explanation ✨
                  </button>
                )}

                {activeExplainId === qIdx && (
                  <div className="mt-6 p-5 bg-blue-50/50 rounded-2xl border-2 border-blue-100 text-sm text-blue-900 leading-relaxed font-medium animate-slideDown shadow-inner relative">
                    <div className="absolute -top-3 left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-blue-100"></div>
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-blue-400 uppercase font-black">AI is generating insight...</span>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Growth Plan Section */}
          <div className="mt-16 bg-gray-900 rounded-3xl p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-800/20 rounded-full translate-x-32 -translate-y-32 blur-3xl group-hover:bg-green-800/40 transition-all duration-1000"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <h3 className="text-3xl font-black mb-4 flex items-center gap-4">
                    <span className="text-4xl">🤖</span> AI Growth Plan
                  </h3>
                  <p className="text-base opacity-70 font-medium leading-relaxed">
                    Excellence is a habit, not an act. Let Al'Istiqama's AI analyze your performance gaps for this specific exam and build a unique roadmap to help you master these concepts.
                  </p>
                </div>
                {studyPlan ? (
                   <button 
                   onClick={() => setStudyPlan(null)}
                   className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all border border-white/20"
                 >
                   Regenerate Plan
                 </button>
                ) : (
                  <button 
                    onClick={() => handleStudyPlan()}
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-green-950 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? 'Consulting Gemini...' : 'Analyze My Performance'}
                  </button>
                )}
              </div>
              
              {studyPlan && (
                <div className="mt-10 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-sm leading-relaxed whitespace-pre-wrap animate-fadeIn ring-1 ring-white/10">
                  <div className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-4">Personalized Roadmap</div>
                  {studyPlan}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ResultsPage;

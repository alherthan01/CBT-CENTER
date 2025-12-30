
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Exam, ExamResult, Question, UserRole, ExamSession } from '../types';
import { MOCK_EXAMS, FACULTIES, MOCK_USERS } from '../constants';

interface DashboardProps {
  user: User;
}

type LecturerTab = 'overview' | 'exams' | 'questions' | 'results' | 'reports';
type AdminTab = 'admin_overview' | 'users' | 'settings' | 'admin_reports' | 'backup' | 'audit';

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [customExams, setCustomExams] = useState<Exam[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([]);
  const [activeTab, setActiveTab] = useState<LecturerTab | AdminTab>(user.role === 'admin' ? 'admin_overview' : 'overview');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<{id: string, action: string, user: string, time: string}[]>([]);
  
  // Create Exam Form State
  const [examForm, setExamForm] = useState<Partial<Exam>>({
    title: '',
    code: '',
    duration: 30,
    level: '100 Level',
    instructions: ['Answer all questions', 'Ensure stable connection']
  });

  // Question Form State
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 2
  });

  // Admin User Form State
  const [newUserForm, setNewUserForm] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'student',
    matric: '',
    department: '',
    level: '100 Level'
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    session: '2023/2024',
    semester: 'Second Semester',
    passingGrade: 50,
    maintenanceMode: false,
    examAvailability: true
  });

  useEffect(() => {
    // Load student results
    const storedResults = JSON.parse(localStorage.getItem('ausu_results') || '[]');
    setResults(storedResults);
    
    // Load active sessions (for resumption)
    const sessions = JSON.parse(localStorage.getItem('ausu_active_sessions') || '[]');
    setActiveSessions(sessions);
    
    // Load custom exams created by lecturers
    const storedExams = JSON.parse(localStorage.getItem('ausu_custom_exams') || '[]');
    setCustomExams(storedExams);

    // Load users
    const storedUsers = JSON.parse(localStorage.getItem('ausu_users') || JSON.stringify(MOCK_USERS));
    setAllUsers(storedUsers);
    if (!localStorage.getItem('ausu_users')) {
      localStorage.setItem('ausu_users', JSON.stringify(MOCK_USERS));
    }

    // Load logs
    const logs = JSON.parse(localStorage.getItem('ausu_audit_logs') || '[]');
    setAuditLogs(logs);

    // Load settings
    const settings = JSON.parse(localStorage.getItem('ausu_settings') || JSON.stringify(systemSettings));
    setSystemSettings(settings);
  }, []);

  const addAuditLog = (action: string) => {
    const newLog = {
      id: `log_${Date.now()}`,
      action,
      user: user.name,
      time: new Date().toISOString()
    };
    const updated = [newLog, ...auditLogs].slice(0, 100);
    setAuditLogs(updated);
    localStorage.setItem('ausu_audit_logs', JSON.stringify(updated));
  };

  const allExams = [...MOCK_EXAMS, ...customExams];

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title || !examForm.code) return;

    const newExam: Exam = {
      id: `custom_${Date.now()}`,
      title: examForm.title,
      code: examForm.code,
      duration: examForm.duration || 30,
      level: examForm.level || '100 Level',
      faculty: user.faculty || 'science',
      department: user.department || 'General',
      questions: [],
      instructions: examForm.instructions || []
    };

    const updated = [...customExams, newExam];
    setCustomExams(updated);
    localStorage.setItem('ausu_custom_exams', JSON.stringify(updated));
    addAuditLog(`Created new exam: ${newExam.code}`);
    setExamForm({ title: '', code: '', duration: 30, level: '100 Level', instructions: ['Answer all questions'] });
    alert('Exam created successfully!');
    setActiveTab('questions');
    setSelectedExamId(newExam.id);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !questionForm.text) return;

    const examIdx = customExams.findIndex(e => e.id === selectedExamId);
    if (examIdx === -1) {
      alert('Cannot add questions to system-locked exams.');
      return;
    }

    const newQ: Question = {
      id: `q_${Date.now()}`,
      text: questionForm.text,
      options: questionForm.options || ['', '', '', ''],
      correctAnswer: questionForm.correctAnswer || 0,
      marks: questionForm.marks || 2
    };

    const updated = [...customExams];
    updated[examIdx].questions.push(newQ);
    setCustomExams(updated);
    localStorage.setItem('ausu_custom_exams', JSON.stringify(updated));
    addAuditLog(`Added question to exam ${updated[examIdx].code}`);
    setQuestionForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 2 });
    alert('Question added successfully.');
  };

  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const handleDeleteQuestion = (examId: string, qId: string) => {
    const examIdx = customExams.findIndex(e => e.id === examId);
    if (examIdx === -1) return;

    const updated = [...customExams];
    updated[examIdx].questions = updated[examIdx].questions.filter(q => q.id !== qId);
    setCustomExams(updated);
    localStorage.setItem('ausu_custom_exams', JSON.stringify(updated));
    addAuditLog(`Deleted question from exam ${updated[examIdx].code}`);
  };

  const deleteExam = (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    const examToDelete = customExams.find(e => e.id === id);
    const updated = customExams.filter(e => e.id !== id);
    setCustomExams(updated);
    localStorage.setItem('ausu_custom_exams', JSON.stringify(updated));
    if (examToDelete) addAuditLog(`Deleted exam: ${examToDelete.code}`);
    if (selectedExamId === id) setSelectedExamId('');
  };

  // --- Admin Actions ---
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newUserForm.name || '',
      email: newUserForm.email || '',
      role: newUserForm.role as UserRole,
      matric: newUserForm.matric,
      department: newUserForm.department,
      level: newUserForm.level
    };
    const updated = [...allUsers, newUser];
    setAllUsers(updated);
    localStorage.setItem('ausu_users', JSON.stringify(updated));
    addAuditLog(`Added user: ${newUser.name} (${newUser.role})`);
    setNewUserForm({ name: '', email: '', role: 'student', matric: '', department: '', level: '100 Level' });
    alert('User added successfully!');
  };

  const handleDeleteUser = (id: string) => {
    if (id === user.id) return alert("You cannot delete yourself.");
    if (!confirm('Are you sure you want to delete this user?')) return;
    const userToDelete = allUsers.find(u => u.id === id);
    const updated = allUsers.filter(u => u.id !== id);
    setAllUsers(updated);
    localStorage.setItem('ausu_users', JSON.stringify(updated));
    if (userToDelete) addAuditLog(`Deleted user: ${userToDelete.name}`);
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ausu_settings', JSON.stringify(systemSettings));
    addAuditLog(`Updated global system settings`);
    alert('Settings updated successfully!');
  };

  const handleBackup = () => {
    const data = {
      exams: customExams,
      results: results,
      users: allUsers,
      settings: systemSettings,
      logs: auditLogs
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ausu_cbt_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    addAuditLog(`System backup generated`);
  };

  // --- Student View ---
  if (user.role === 'student') {
    const studentResults = results.filter(r => r.userId === user.id);
    const avgScore = studentResults.length > 0 
      ? Math.round(studentResults.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / studentResults.length) 
      : 0;

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-green-900 mb-1">Welcome, {user.name}!</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-yellow-200">
                {user.role}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 font-medium">{user.department}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 font-medium">{user.level}</span>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-green-800 uppercase tracking-tighter">{systemSettings.session} Session</div>
            <div className="text-xs text-gray-500">{systemSettings.semester}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Available Exams', value: allExams.length, icon: '📚', color: 'bg-blue-50 text-blue-700' },
            { label: 'Exams Taken', value: studentResults.length, icon: '✅', color: 'bg-green-50 text-green-700' },
            { label: 'Avg. Score', value: `${avgScore}%`, icon: '📊', color: 'bg-purple-50 text-purple-700' },
            { label: 'Current Level', value: user.level || '100L', icon: '🎯', color: 'bg-orange-50 text-orange-700' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:translate-y-[-4px] transition-transform duration-300">
              <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4 text-xl`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-black text-gray-800 mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-lg font-extrabold text-green-900 flex items-center gap-2">
              <span className="text-xl">📝</span> Available Examinations
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {allExams.map(exam => {
              const isTaken = studentResults.some(r => r.examId === exam.id);
              const inProgressSession = activeSessions.find(s => s.userId === user.id && s.examId === exam.id);
              
              return (
                <div key={exam.id} className={`p-6 hover:bg-green-50/30 transition-colors flex flex-col md:flex-row justify-between items-center gap-4 group ${isTaken ? 'opacity-70 bg-gray-50/30' : ''}`}>
                  <div className="flex-grow text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                      <span className="text-green-800 font-black text-sm">{exam.code}</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{exam.level}</span>
                      {isTaken && (
                        <span className="ml-2 bg-green-800 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Completed
                        </span>
                      )}
                      {inProgressSession && !isTaken && (
                        <span className="ml-2 bg-yellow-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                          In-Progress / Interrupted
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-800 transition-colors">{exam.title}</h4>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 justify-center md:justify-start">
                      <span className="flex items-center gap-1"><span className="text-sm">⏰</span> {exam.duration} mins</span>
                      <span className="flex items-center gap-1"><span className="text-sm">❓</span> {exam.questions.length} Questions</span>
                    </div>
                  </div>
                  {isTaken ? (
                    <button 
                      onClick={() => navigate(`/results`)}
                      className="whitespace-nowrap bg-white text-green-800 border-2 border-green-800 px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-green-50 transition-all active:scale-95"
                    >
                      View Result
                    </button>
                  ) : inProgressSession ? (
                    <button 
                      onClick={() => navigate(`/exam/${exam.id}`)}
                      className="whitespace-nowrap bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span>🔄</span> Resume Examination
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/exam/${exam.id}`)}
                      className="whitespace-nowrap bg-green-800 hover:bg-green-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                      Start Exam
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Lecturer View Tabs ---
  const renderLecturerTabs = () => (
    <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner border border-gray-200 mb-8 overflow-x-auto">
      {[
        { id: 'overview', label: 'Overview', icon: '🏠' },
        { id: 'exams', label: 'Create Exam', icon: '📝' },
        { id: 'questions', label: 'Manage Questions', icon: '❓' },
        { id: 'results', label: 'Student Results', icon: '🎓' },
        { id: 'reports', label: 'Reports', icon: '📊' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as LecturerTab)}
          className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === tab.id 
              ? 'bg-white shadow-md text-green-800 scale-105' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  // --- Admin View Tabs ---
  const renderAdminTabs = () => (
    <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner border border-gray-200 mb-8 overflow-x-auto">
      {[
        { id: 'admin_overview', label: 'Admin Panel', icon: '🛠️' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'settings', label: 'System Settings', icon: '⚙️' },
        { id: 'admin_reports', label: 'System Reports', icon: '📈' },
        { id: 'backup', label: 'Backup & Restore', icon: '💾' },
        { id: 'audit', label: 'Audit Logs', icon: '📜' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as AdminTab)}
          className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === tab.id 
              ? 'bg-white shadow-md text-green-800 scale-105' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Managed Exams', value: customExams.length, icon: '📂', color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Submissions', value: results.length, icon: '📥', color: 'bg-green-50 text-green-700' },
          { label: 'Average Pass Rate', value: '74%', icon: '📈', color: 'bg-purple-50 text-purple-700' },
          { label: 'Pending Reviews', value: '0', icon: '⏳', color: 'bg-orange-50 text-orange-700' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4 text-xl`}>{stat.icon}</div>
            <div className="text-3xl font-black text-gray-800 mb-1">{stat.value}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-green-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {results.slice(0, 5).map((res, i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-800 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {res.userName[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{res.userName}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Completed {res.examCode}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-green-800">{res.percentage}%</div>
                <div className="text-[10px] text-gray-400 font-bold">{new Date(res.submittedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
          {results.length === 0 && <p className="text-center text-gray-400 italic py-4">No recent submissions found.</p>}
        </div>
      </div>
    </div>
  );

  const renderExamCreator = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
          <h3 className="text-xl font-black text-green-900 mb-6 flex items-center gap-2">
            <span className="p-2 bg-green-100 rounded-lg">➕</span> Create Exam
          </h3>
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Course Code</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 focus:outline-none transition-all text-sm font-bold"
                placeholder="e.g. CSC 101"
                value={examForm.code}
                onChange={e => setExamForm({...examForm, code: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Exam Title</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 focus:outline-none transition-all text-sm font-bold"
                placeholder="e.g. Data Structures"
                value={examForm.title}
                onChange={e => setExamForm({...examForm, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration (min)</label>
                <input 
                  type="number"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 focus:outline-none transition-all text-sm font-bold"
                  value={examForm.duration}
                  onChange={e => setExamForm({...examForm, duration: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Level</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 focus:outline-none transition-all text-sm font-bold bg-white"
                  value={examForm.level}
                  onChange={e => setExamForm({...examForm, level: e.target.value})}
                >
                  <option>100 Level</option>
                  <option>200 Level</option>
                  <option>300 Level</option>
                  <option>400 Level</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-4 ausu-gradient text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all mt-4">
              Initialize Exam
            </button>
          </form>
        </div>
      </div>
      
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Your Custom Examinations</h3>
            <span className="text-[10px] font-black text-green-800 bg-green-100 px-3 py-1 rounded-full">{customExams.length} Total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {customExams.map(exam => (
              <div key={exam.id} className="p-6 flex justify-between items-center group hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-800 font-black text-sm">{exam.code}</span>
                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">{exam.level}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mt-1">{exam.title}</h4>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                    <span>⏱️ {exam.duration} mins</span>
                    <span>❓ {exam.questions.length} questions</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {setSelectedExamId(exam.id); setActiveTab('questions');}}
                    className="p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm"
                    title="Manage Questions"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => deleteExam(exam.id)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm"
                    title="Delete Exam"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {customExams.length === 0 && (
              <div className="p-20 text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No custom exams found. Use the form to create your first one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestionManager = () => {
    const selectedExam = customExams.find(e => e.id === selectedExamId);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-xl font-black text-green-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-blue-100 rounded-lg">❓</span> Add Question
            </h3>
            
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Select Exam</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 focus:outline-none transition-all text-sm font-bold bg-white"
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
              >
                <option value="">-- Choose Exam --</option>
                {customExams.map(e => <option key={e.id} value={e.id}>{e.code}: {e.title}</option>)}
              </select>
            </div>

            {selectedExamId ? (
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Question Text</label>
                  <textarea 
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 focus:outline-none transition-all text-sm font-bold h-32"
                    placeholder="Enter the question here..."
                    value={questionForm.text}
                    onChange={e => setQuestionForm({...questionForm, text: e.target.value})}
                  />
                </div>
                {questionForm.options?.map((opt, i) => (
                  <div key={i}>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Option {String.fromCharCode(65+i)}</label>
                    <input 
                      required
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-50 focus:border-green-800 focus:outline-none transition-all text-sm font-bold"
                      value={opt}
                      onChange={e => {
                        const opts = [...(questionForm.options || [])];
                        opts[i] = e.target.value;
                        setQuestionForm({...questionForm, options: opts});
                      }}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Correct Ans</label>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-50 bg-white text-sm font-bold"
                      value={questionForm.correctAnswer}
                      onChange={e => setQuestionForm({...questionForm, correctAnswer: parseInt(e.target.value)})}
                    >
                      <option value={0}>A</option>
                      <option value={1}>B</option>
                      <option value={2}>C</option>
                      <option value={3}>D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marks</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-50 text-sm font-bold"
                      value={questionForm.marks}
                      onChange={e => setQuestionForm({...questionForm, marks: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-green-800 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all mt-4">
                  Save Question
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-400 text-sm py-10 font-medium">Please select an exam to add questions.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedExam ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Current Questions: {selectedExam.code}</h3>
                <span className="text-[10px] font-black text-blue-800 bg-blue-100 px-3 py-1 rounded-full">{selectedExam.questions.length} Added</span>
              </div>
              <div className="divide-y divide-gray-100">
                {selectedExam.questions.map((q, idx) => (
                  <div key={q.id} className="p-8 group hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Question {idx + 1} ({q.marks} Marks)</span>
                       <button 
                         onClick={() => handleDeleteQuestion(selectedExam.id, q.id)}
                         className="text-red-400 hover:text-red-600 font-bold text-xs uppercase"
                       >
                         Remove
                       </button>
                    </div>
                    <p className="font-bold text-gray-800 text-lg mb-6 leading-relaxed">{q.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`p-4 rounded-xl border-2 text-sm flex items-center gap-3 ${i === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-900 font-bold' : 'bg-gray-50 border-gray-50 text-gray-600 font-medium'}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === q.correctAnswer ? 'bg-green-800 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {String.fromCharCode(65+i)}
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedExam.questions.length === 0 && (
                  <div className="p-20 text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">No questions bank available for this exam yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
               <div className="text-6xl mb-6 opacity-20">📂</div>
               <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Select an exam to manage questions</h3>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResultsViewer = () => {
    const filteredResults = results.filter(r => 
      r.userName.toLowerCase().includes(resultFilter.toLowerCase()) || 
      r.matric?.toLowerCase().includes(resultFilter.toLowerCase()) ||
      r.examCode.toLowerCase().includes(resultFilter.toLowerCase())
    );

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <h3 className="text-2xl font-black text-green-900">Student Results Monitor</h3>
            <div className="relative w-full md:w-96">
              <input 
                className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 focus:border-green-800 focus:outline-none transition-all text-sm font-bold"
                placeholder="Filter by name, matric, or code..."
                value={resultFilter}
                onChange={e => setResultFilter(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Student</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Examination</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-center">Score</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-center">Grade</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredResults.map((res, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-4">
                      <div className="font-bold text-gray-900">{res.userName}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{res.matric || 'N/A'}</div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="font-black text-green-800 text-sm">{res.examCode}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[200px]">{res.examTitle}</div>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <div className="font-black text-xl text-gray-800">{res.percentage}%</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{res.score}/{res.totalMarks} Marks</div>
                    </td>
                    <td className="py-5 px-4 text-center">
                       <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                         res.grade.grade === 'F' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                       }`}>
                         {res.grade.grade}
                       </span>
                    </td>
                    <td className="py-5 px-4 text-right">
                       <div className="text-xs font-bold text-gray-700">{new Date(res.submittedAt).toLocaleDateString()}</div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(res.submittedAt).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs italic">No matching records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    // Basic Distribution Logic
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    results.forEach(r => gradeCounts[r.grade.grade]++);
    
    const maxGrade = Math.max(...Object.values(gradeCounts), 1);
    const passCount = results.filter(r => r.grade.grade !== 'F').length;
    const failCount = results.length - passCount;

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-green-900 mb-10 flex items-center justify-between">
              Grade Distribution
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total: {results.length}</span>
            </h3>
            <div className="flex items-end justify-between h-48 px-4 gap-4">
              {Object.entries(gradeCounts).map(([grade, count]) => (
                <div key={grade} className="flex-grow flex flex-col items-center group">
                  <div className="text-xs font-black text-gray-400 mb-2 group-hover:text-green-800 transition-colors">{count}</div>
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-700 origin-bottom group-hover:scale-x-105 shadow-lg ${grade === 'F' ? 'bg-red-500' : 'bg-green-700'}`} 
                    style={{ height: `${(count / maxGrade) * 100}%` }}
                  ></div>
                  <div className="text-sm font-black text-gray-800 mt-4">{grade}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
             <div>
               <h3 className="text-xl font-black mb-10 flex items-center justify-between">
                 Pass / Fail Statistics
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Report</span>
               </h3>
               <div className="flex gap-4 items-center mb-8">
                 <div className="text-5xl font-black text-green-500">{results.length > 0 ? Math.round((passCount/results.length)*100) : 0}%</div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Overall Pass Rate for the 2023/24 Academic Session</div>
               </div>
               <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span>Successful Students</span>
                      <span className="text-green-400">{passCount}</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${results.length > 0 ? (passCount/results.length)*100 : 0}%` }}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span>Requirement Not Met</span>
                      <span className="text-red-400">{failCount}</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${results.length > 0 ? (failCount/results.length)*100 : 0}%` }}></div>
                    </div>
                 </div>
               </div>
             </div>
             <button 
               onClick={() => alert('Exporting full faculty report as PDF...')}
               className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all mt-10 active:scale-95"
             >
               Export Official PDF Report
             </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Admin Specific Views ---
  const renderAdminOverview = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-4xl mb-4">👥</div>
          <h4 className="text-3xl font-black text-gray-800">{allUsers.length}</h4>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Registered Users</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-4xl mb-4">📚</div>
          <h4 className="text-3xl font-black text-gray-800">{allExams.length}</h4>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Exam Database</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-4xl mb-4">⚡</div>
          <h4 className="text-3xl font-black text-gray-800">{results.length}</h4>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Transactions</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
          <span>🛡️</span> System Status Hub
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex justify-between items-center">
            <span className="text-sm font-bold text-green-800">CBT Core Engine</span>
            <span className="text-xs font-black text-green-600 uppercase">Operational</span>
          </div>
          <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex justify-between items-center">
            <span className="text-sm font-bold text-green-800">Database Cluster</span>
            <span className="text-xs font-black text-green-600 uppercase">Healthy</span>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex justify-between items-center">
            <span className="text-sm font-bold text-blue-800">Gemini AI Service</span>
            <span className="text-xs font-black text-blue-600 uppercase">Connected</span>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">Storage Sync</span>
            <span className="text-xs font-black text-gray-400 uppercase">Idle</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => {
    const filteredUsers = allUsers.filter(u => 
      u.name.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.matric?.toLowerCase().includes(userFilter.toLowerCase())
    );

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-green-900 mb-6">Enroll New User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                  <input required className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold" placeholder="John Doe" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
                  <input type="email" required className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold" placeholder="john@au.edu.ng" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}>
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Department</label>
                    <input className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold" placeholder="CSC" value={newUserForm.department} onChange={e => setNewUserForm({...newUserForm, department: e.target.value})} />
                  </div>
                </div>
                {newUserForm.role === 'student' && (
                  <div className="grid grid-cols-2 gap-4 animate-slideDown">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Matric No.</label>
                      <input className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold" placeholder="AUS/..." value={newUserForm.matric} onChange={e => setNewUserForm({...newUserForm, matric: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Level</label>
                      <select className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white" value={newUserForm.level} onChange={e => setNewUserForm({...newUserForm, level: e.target.value})}>
                        <option>100 Level</option>
                        <option>200 Level</option>
                        <option>300 Level</option>
                        <option>400 Level</option>
                      </select>
                    </div>
                  </div>
                )}
                <button type="submit" className="w-full py-3 ausu-gradient text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all mt-4">
                  Provision Account
                </button>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">User Directory</h3>
                <input 
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold w-48 focus:outline-none"
                  placeholder="Search users..."
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="p-6">User Identity</th>
                      <th className="p-6">Role</th>
                      <th className="p-6">Department</th>
                      <th className="p-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-6">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-[10px] font-bold text-gray-400">{u.email}</div>
                          {u.matric && <div className="text-[9px] font-black text-green-700">{u.matric}</div>}
                        </td>
                        <td className="p-6">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            u.role === 'lecturer' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-6 text-sm font-bold text-gray-500">{u.department || 'N/A'}</td>
                        <td className="p-6 text-right">
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 font-bold text-xs uppercase transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSystemSettings = () => (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h3 className="text-2xl font-black text-green-900 mb-8 flex items-center gap-3">
          <span className="p-2 bg-green-50 rounded-xl">⚙️</span> Core System Configuration
        </h3>
        <form onSubmit={handleUpdateSettings} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Academic Metadata</h4>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Current Academic Session</label>
                <input className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 transition-all text-sm font-bold" value={systemSettings.session} onChange={e => setSystemSettings({...systemSettings, session: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Current Semester</label>
                <select className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 transition-all text-sm font-bold bg-white" value={systemSettings.semester} onChange={e => setSystemSettings({...systemSettings, semester: e.target.value})}>
                  <option>First Semester</option>
                  <option>Second Semester</option>
                  <option>Summer Session</option>
                </select>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Exam Controller</h4>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Global Passing Grade (%)</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 focus:border-green-800 transition-all text-sm font-bold" value={systemSettings.passingGrade} onChange={e => setSystemSettings({...systemSettings, passingGrade: parseInt(e.target.value)})} />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                 <span className="text-sm font-bold text-gray-700">Exam Accessibility</span>
                 <button type="button" onClick={() => setSystemSettings({...systemSettings, examAvailability: !systemSettings.examAvailability})} className={`w-12 h-6 rounded-full transition-all relative ${systemSettings.examAvailability ? 'bg-green-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemSettings.examAvailability ? 'left-7' : 'left-1'}`}></div>
                 </button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex justify-end">
             <button type="submit" className="px-10 py-4 ausu-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all">
                Commit Changes
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderAdminReports = () => {
    const totalUsers = allUsers.length;
    const studentCount = allUsers.filter(u => u.role === 'student').length;
    const lecturerCount = allUsers.filter(u => u.role === 'lecturer').length;
    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-green-900 mb-10">Administrative Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { label: 'System Pass Rate', value: '72%', trend: '+5%', icon: '📊' },
               { label: 'Avg Exam Time', value: '42m', trend: '-2m', icon: '⏱️' },
               { label: 'Integrity Score', value: '99.9%', trend: '0%', icon: '🛡️' },
               { label: 'Peak Concurrency', value: '245', trend: '+12', icon: '⚡' },
             ].map((r, i) => (
               <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <div className="text-2xl font-black text-gray-800 leading-none mb-1">{r.value}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-3">{r.label}</div>
                  <div className={`text-[10px] font-black ${r.trend.startsWith('+') ? 'text-green-600' : r.trend.startsWith('-') ? 'text-blue-600' : 'text-gray-400'}`}>
                    {r.trend} vs Last Period
                  </div>
               </div>
             ))}
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="p-8 rounded-3xl bg-gray-900 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full translate-x-20 -translate-y-20"></div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">User Composition</h4>
                <div className="space-y-6">
                   {[
                     { label: 'Students', count: studentCount, pct: Math.round((studentCount/totalUsers)*100), color: 'bg-green-500' },
                     { label: 'Faculty Staff', count: lecturerCount, pct: Math.round((lecturerCount/totalUsers)*100), color: 'bg-blue-500' },
                     { label: 'Administrators', count: adminCount, pct: Math.round((adminCount/totalUsers)*100), color: 'bg-purple-500' },
                   ].map((item, idx) => (
                     <div key={idx}>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                           <span>{item.label}</span>
                           <span>{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                           <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="flex flex-col justify-between">
                <div className="p-8 rounded-3xl border-2 border-green-800 bg-white shadow-xl shadow-green-100">
                   <h4 className="text-xl font-black text-green-900 mb-4 tracking-tighter">Senate Briefing Note</h4>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 italic">
                     "The current session reflects a significant increase in CBT adoption across all departments. Examination integrity remains at an all-time high with no reported breaches during the Second Semester midterm phase."
                   </p>
                   <button className="w-full py-4 ausu-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all">
                      Generate Board Transcript
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBackup = () => (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-blue-100">
          <span className="text-4xl">💾</span>
        </div>
        <h3 className="text-2xl font-black text-gray-800 mb-4">Disaster Recovery & Data Portability</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-10 max-w-sm mx-auto">
          Ensure system continuity by generating encrypted backups of all examination data, student records, and system configurations.
        </p>
        
        <div className="grid grid-cols-1 gap-4">
           <button onClick={handleBackup} className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-100 transition-all group flex items-center justify-between">
              <div className="text-left">
                <div className="text-sm font-black text-blue-900 uppercase tracking-widest">Generate Snapshot</div>
                <div className="text-[10px] font-bold text-blue-500 mt-1">Full system JSON export</div>
              </div>
              <span className="text-xl group-hover:scale-125 transition-transform">🚀</span>
           </button>
           
           <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Restore Point</div>
              <label className="cursor-pointer bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                 Upload Recovery File
                 <input type="file" className="hidden" onChange={() => alert('Recovery validation started...')} />
              </label>
           </div>
        </div>
        
        <div className="mt-10 p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center gap-4 text-left">
           <span className="text-2xl">⚠️</span>
           <div className="text-[10px] font-bold text-yellow-800 leading-relaxed uppercase tracking-widest">
             Restoring from a backup will overwrite current local storage data. Proceed with caution.
           </div>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="max-w-4xl mx-auto animate-fadeIn">
       <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">System Immutable Audit Trail</h3>
            <button onClick={() => {setAuditLogs([]); localStorage.removeItem('ausu_audit_logs');}} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear History</button>
          </div>
          <div className="divide-y divide-gray-50">
             {auditLogs.map(log => (
               <div key={log.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-black text-[10px] shrink-0">
                    {new Date(log.time).getHours()}:{new Date(log.time).getMinutes()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{log.action}</div>
                    <div className="text-[10px] font-bold text-gray-400 mt-1">
                      Targeted by <span className="text-green-800 uppercase">{log.user}</span> • {new Date(log.time).toLocaleString()}
                    </div>
                  </div>
               </div>
             ))}
             {auditLogs.length === 0 && (
               <div className="p-20 text-center text-gray-400 italic">No system actions logged yet.</div>
             )}
          </div>
       </div>
    </div>
  );

  // --- Main Render Logic ---
  const isLecturerView = user.role === 'lecturer' || user.role === 'hod' || user.role === 'exam_officer';
  const isAdminView = user.role === 'admin';

  return (
    <div className="space-y-4 animate-fadeIn pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 mb-4 sticky top-[4.5rem] z-30">
        <div>
          <h2 className="text-3xl font-extrabold text-green-900 mb-1 leading-none tracking-tight">
            {isAdminView ? 'System Administration Console' : 'Faculty Control Center'}
          </h2>
          <div className="flex flex-wrap gap-2 items-center mt-2">
            <span className="bg-green-100 text-green-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-green-200">
              {user.role.toUpperCase()}
            </span>
            <span className="text-gray-300 text-xs font-bold">•</span>
            <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">{user.name}</span>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm font-black text-green-800 uppercase tracking-widest">{systemSettings.session} Academic Cycle</div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-tighter">{systemSettings.semester}</div>
        </div>
      </div>

      {isAdminView ? renderAdminTabs() : renderLecturerTabs()}

      <div className="min-h-[600px]">
        {/* Lecturer Sections */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'exams' && renderExamCreator()}
        {activeTab === 'questions' && renderQuestionManager()}
        {activeTab === 'results' && renderResultsViewer()}
        {activeTab === 'reports' && renderReports()}

        {/* Admin Sections */}
        {activeTab === 'admin_overview' && renderAdminOverview()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'settings' && renderSystemSettings()}
        {activeTab === 'admin_reports' && renderAdminReports()}
        {activeTab === 'backup' && renderBackup()}
        {activeTab === 'audit' && renderAuditLogs()}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideDown { animation: slideDown 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Dashboard;

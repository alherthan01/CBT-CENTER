
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Exam, ExamResult, Question, UserRole, ExamStatus } from '../types';
import { MOCK_EXAMS, MOCK_USERS } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  user: User;
}

type AppTab = 
  | 'overview' 
  | 'exams' 
  | 'questions' 
  | 'pending_approvals'
  | 'results' 
  | 'reports' 
  | 'users' 
  | 'settings' 
  | 'audit';

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [customExams, setCustomExams] = useState<Exam[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [examSearch, setExamSearch] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [auditLogs, setAuditLogs] = useState<{id: string; action: string; user: string; time: string}[]>([]);
  
  const [systemSettings, setSystemSettings] = useState({
    session: '2023/2024',
    semester: 'Second Semester',
    examAvailability: false 
  });

  // User Management State
  const [newUserForm, setNewUserForm] = useState<Partial<User>>({
    name: '', email: '', role: 'student', department: '', level: '100 Level', matric: ''
  });

  // Exam/Question Forms
  const [examForm, setExamForm] = useState<Partial<Exam>>({
    title: '', code: '', duration: 30, level: '100 Level', instructions: ['Answer all questions']
  });
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 2
  });

  useEffect(() => {
    const storedResults = JSON.parse(localStorage.getItem('ausu_results') || '[]');
    const storedExams = JSON.parse(localStorage.getItem('ausu_custom_exams') || '[]');
    const storedUsers = JSON.parse(localStorage.getItem('ausu_users') || JSON.stringify(MOCK_USERS));
    const storedSettings = JSON.parse(localStorage.getItem('ausu_settings') || JSON.stringify(systemSettings));
    const storedLogs = JSON.parse(localStorage.getItem('ausu_audit_logs') || '[]');

    setResults(storedResults);
    setCustomExams(storedExams);
    setAllUsers(storedUsers);
    setSystemSettings(storedSettings);
    setAuditLogs(storedLogs);
  }, []);

  const addAuditLog = (action: string) => {
    const newLog = { id: `log_${Date.now()}`, action, user: user.name, time: new Date().toISOString() };
    const updated = [newLog, ...auditLogs].slice(0, 100);
    setAuditLogs(updated);
    localStorage.setItem('ausu_audit_logs', JSON.stringify(updated));
  };

  const saveExams = (newExams: Exam[]) => {
    setCustomExams(newExams);
    localStorage.setItem('ausu_custom_exams', JSON.stringify(newExams));
  };

  const saveUsers = (newUsers: User[]) => {
    setAllUsers(newUsers);
    localStorage.setItem('ausu_users', JSON.stringify(newUsers));
  };

  const saveSettings = (newSettings: typeof systemSettings) => {
    setSystemSettings(newSettings);
    localStorage.setItem('ausu_settings', JSON.stringify(newSettings));
  };

  const allExams = [...MOCK_EXAMS, ...customExams];

  // --- ADMIN ACTIONS ---
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: newUserForm.name || '',
      email: newUserForm.email || '',
      role: newUserForm.role || 'student',
      matric: newUserForm.matric,
      department: newUserForm.department,
      level: newUserForm.level,
    };
    saveUsers([...allUsers, newUser]);
    setNewUserForm({ name: '', email: '', role: 'student', department: '', level: '100 Level', matric: '' });
    addAuditLog(`Admin created account for ${newUser.name} (${newUser.role})`);
  };

  const handleBackup = () => {
    const data = { results, customExams, allUsers, systemSettings, auditLogs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ausu_cbt_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addAuditLog('Admin generated comprehensive system backup');
  };

  const handlePublishExam = (examId: string) => {
    const updated = [...customExams];
    const idx = updated.findIndex(e => e.id === examId);
    if (idx !== -1) {
      updated[idx].status = 'live';
      saveExams(updated);
      addAuditLog(`Administrator approved and published paper: ${updated[idx].code}`);
      alert("Exam is now LIVE for students.");
    }
  };

  // --- LECTURER ACTIONS ---
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      code: examForm.code || '',
      title: examForm.title || '',
      faculty: user.faculty || 'science',
      department: user.department || 'Computer Science',
      level: examForm.level || '100 Level',
      duration: examForm.duration || 30,
      questions: [],
      instructions: examForm.instructions || ['Answer all questions'],
      status: 'draft',
      ownerId: user.id
    };
    saveExams([...customExams, newExam]);
    setExamForm({ title: '', code: '', duration: 30, level: '100 Level', instructions: ['Answer all questions'] });
    addAuditLog(`Lecturer ${user.name} created exam draft: ${newExam.code}`);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    const updated = [...customExams];
    const exIdx = updated.findIndex(e => e.id === selectedExamId);
    if (exIdx === -1) return;

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: questionForm.text || '',
      options: questionForm.options || ['', '', '', ''],
      correctAnswer: questionForm.correctAnswer ?? 0,
      marks: questionForm.marks ?? 2
    };

    updated[exIdx].questions.push(newQuestion);
    saveExams(updated);
    setQuestionForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 2 });
  };

  // --- RENDER SECTIONS ---

  const renderOverview = () => {
    const isLecturer = user.role === 'lecturer';
    const myExams = allExams.filter(e => e.ownerId === user.id || user.role === 'admin');
    
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 text-xl">🎓</div>
            <div className="text-3xl font-black text-gray-900">{isLecturer ? myExams.length : allUsers.filter(u => u.role === 'student').length}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{isLecturer ? 'My Courses' : 'Students Enrolled'}</div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-xl">📄</div>
            <div className="text-3xl font-black text-gray-900">{allExams.length}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Active Question Papers</div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 text-xl">📊</div>
            <div className="text-3xl font-black text-gray-900">{results.length}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Exams Completed</div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-4 text-xl">🚀</div>
            <div className="text-3xl font-black text-gray-900">{customExams.filter(e => e.status === 'pending').length}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Pending Approvals</div>
          </div>
        </div>

        {user.role === 'admin' && (
          <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl translate-x-32 -translate-y-32"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h3 className="text-3xl font-black mb-2">Master Portal Control</h3>
                <p className="opacity-60 font-bold uppercase tracking-widest text-xs">Currently: <span className={systemSettings.examAvailability ? "text-green-400" : "text-red-400"}>{systemSettings.examAvailability ? 'OPEN' : 'LOCKED'}</span></p>
              </div>
              <button 
                onClick={() => {
                  const newVal = !systemSettings.examAvailability;
                  saveSettings({...systemSettings, examAvailability: newVal});
                  addAuditLog(`Master Portal toggled to ${newVal ? 'OPEN' : 'LOCKED'}`);
                }}
                className={`px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${systemSettings.examAvailability ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
              >
                {systemSettings.examAvailability ? 'Lock All Exams' : 'Unlock Portal Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUserManagement = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
          <h3 className="text-2xl font-black text-green-900 mb-6">Enroll New User</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <input required className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 font-bold text-sm" placeholder="Full Name" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} />
            <input required className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 font-bold text-sm" placeholder="Email Address" type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
               <select className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-white font-bold text-sm" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Staff/Admin</option>
              </select>
              <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 font-bold text-sm" placeholder="Dept" value={newUserForm.department} onChange={e => setNewUserForm({...newUserForm, department: e.target.value})} />
            </div>
            {newUserForm.role === 'student' && (
              <input required className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 font-bold text-sm" placeholder="Matric Number" value={newUserForm.matric} onChange={e => setNewUserForm({...newUserForm, matric: e.target.value})} />
            )}
            <button type="submit" className="w-full py-4 ausu-gradient text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg mt-4">Create Account</button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h4 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Identity Registry</h4>
            <input className="px-4 py-2 border-2 border-gray-100 rounded-xl text-xs font-bold w-48" placeholder="Search name/matric..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr><th className="p-6">User Identity</th><th className="p-6">Role</th><th className="p-6">Affiliation</th><th className="p-6 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.matric?.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase">{u.email}</div>
                    </td>
                    <td className="p-6"><span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">{u.role}</span></td>
                    <td className="p-6"><div className="text-sm font-bold text-gray-700">{u.department || 'General'}</div><div className="text-[10px] font-black text-gray-400">{u.matric || 'N/A'}</div></td>
                    <td className="p-6 text-right">
                      <button onClick={() => {if(confirm(`Remove ${u.name}?`)){ saveUsers(allUsers.filter(usr => usr.id !== u.id)); addAuditLog(`Terminated user account: ${u.name}`); }}} className="text-red-400 hover:text-red-600 font-black text-xs uppercase">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">System Immutable Audit Trail</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time security logs</p>
        </div>
        <button onClick={() => {localStorage.setItem('ausu_audit_logs', '[]'); setAuditLogs([]);}} className="text-xs font-black text-red-500 uppercase tracking-widest">Purge Logs</button>
      </div>
      <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto no-scrollbar">
        {auditLogs.map(log => (
          <div key={log.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-xs shrink-0">{new Date(log.time).getHours()}:{new Date(log.time).getMinutes()}</div>
            <div>
              <div className="font-bold text-gray-800 text-sm leading-tight">{log.action}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Actor: <span className="text-green-800">{log.user}</span> • {new Date(log.time).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {auditLogs.length === 0 && <div className="p-20 text-center text-gray-300 font-black uppercase text-xs italic tracking-widest">No system events recorded.</div>}
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-4 ausu-gradient rounded-t-[3rem]"></div>
        <h3 className="text-3xl font-black text-green-900 mb-10 flex items-center gap-4">⚙️ System Core Settings</h3>
        
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Academic Session</label>
              <input className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 font-black text-sm" value={systemSettings.session} onChange={e => saveSettings({...systemSettings, session: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Semester</label>
              <select className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-white font-black text-sm" value={systemSettings.semester} onChange={e => saveSettings({...systemSettings, semester: e.target.value})}>
                <option>First Semester</option>
                <option>Second Semester</option>
              </select>
            </div>
          </div>

          <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Backup & Disaster Recovery</h4>
            <div className="flex flex-col md:flex-row gap-6">
              <button onClick={handleBackup} className="flex-grow py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all">Download Secure Backup (.json)</button>
              <label className="flex-grow py-5 bg-white border-2 border-gray-200 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest text-center cursor-pointer hover:border-green-800 transition-all">
                Restore from Archive
                <input type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (confirm("This will overwrite all current system data. Proceed?")) {
                      localStorage.setItem('ausu_results', JSON.stringify(data.results));
                      localStorage.setItem('ausu_custom_exams', JSON.stringify(data.customExams));
                      localStorage.setItem('ausu_users', JSON.stringify(data.allUsers));
                      localStorage.setItem('ausu_settings', JSON.stringify(data.systemSettings));
                      localStorage.setItem('ausu_audit_logs', JSON.stringify(data.auditLogs));
                      window.location.reload();
                    }
                  }
                }} />
              </label>
            </div>
            <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Backups include user registries, question banks, and candidate results.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const adminNav: { id: AppTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Admin Hub', icon: '🏠' },
    { id: 'pending_approvals', label: 'Dispatcher', icon: '🚀' },
    { id: 'results', label: 'Grading Monitor', icon: '🎓' },
    { id: 'reports', label: 'Analytics', icon: '📊' },
    { id: 'users', label: 'Registry', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'audit', label: 'Audit Logs', icon: '📜' },
  ];

  const lecturerNav: { id: AppTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Lecturer Hub', icon: '🏠' },
    { id: 'exams', label: 'Assessments', icon: '📝' },
    { id: 'questions', label: 'Bank', icon: '❓' },
    { id: 'results', label: 'Grading', icon: '🎓' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ];

  const activeNav = user.role === 'admin' ? adminNav : lecturerNav;

  return (
    <div className="space-y-6 pb-20">
      {user.role !== 'student' && (
        <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 flex items-center justify-center gap-1 sticky top-20 z-50 max-w-fit mx-auto overflow-x-auto no-scrollbar scroll-smooth">
          {activeNav.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-3 rounded-3xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'bg-green-800 text-white shadow-xl scale-105' : 'text-gray-400 hover:bg-gray-50'}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'settings' && renderSystemSettings()}
        {activeTab === 'audit' && renderAuditLogs()}
        
        {/* SHARED OR PORTED RENDERS */}
        {activeTab === 'exams' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                <h3 className="text-2xl font-black text-green-900 mb-6">Create New Exam</h3>
                <form onSubmit={handleCreateExam} className="space-y-4">
                  <input required className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 font-bold text-sm" placeholder="Course Code" value={examForm.code} onChange={e => setExamForm({...examForm, code: e.target.value.toUpperCase()})} />
                  <input required className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 font-bold text-sm" placeholder="Title" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} />
                  <input type="number" required className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 font-bold text-sm" placeholder="Duration (Mins)" value={examForm.duration} onChange={e => setExamForm({...examForm, duration: parseInt(e.target.value)})} />
                  <button type="submit" className="w-full py-4 ausu-gradient text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg mt-4">Initialize Paper</button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                  <h4 className="text-xl font-black text-gray-800 uppercase tracking-tighter">My Assessments</h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {customExams.filter(e => e.ownerId === user.id).map(ex => (
                    <div key={ex.id} className="p-8 flex justify-between items-center hover:bg-gray-50 transition-all">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-green-800 font-black text-sm">{ex.code}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest bg-gray-100 text-gray-500">{ex.status}</span>
                        </div>
                        <h5 className="text-lg font-bold text-gray-900">{ex.title}</h5>
                      </div>
                      <button onClick={() => {setSelectedExamId(ex.id); setActiveTab('questions');}} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">Manage Bank</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl sticky top-24">
                <h3 className="text-2xl font-black text-blue-900 mb-6">Manage Question Bank</h3>
                <select className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-white font-bold text-sm mb-6" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                  <option value="">-- Select Course --</option>
                  {customExams.filter(e => e.ownerId === user.id || user.role === 'admin').map(e => <option key={e.id} value={e.id}>{e.code}: {e.title}</option>)}
                </select>
                {selectedExamId && (
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <textarea required className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 text-sm font-bold h-32" placeholder="Question Text" value={questionForm.text} onChange={e => setQuestionForm({...questionForm, text: e.target.value})} />
                    {questionForm.options?.map((opt, i) => (
                      <input key={i} required className="w-full px-5 py-2 rounded-xl border-2 border-gray-50 text-sm font-bold" placeholder={`Option ${String.fromCharCode(65+i)}`} value={opt} onChange={e => {
                        const opts = [...(questionForm.options || [])];
                        opts[i] = e.target.value;
                        setQuestionForm({...questionForm, options: opts});
                      }} />
                    ))}
                    <button type="submit" className="w-full py-4 bg-blue-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md">Add to Bank</button>
                  </form>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 bg-blue-900 text-white">
                  <h4 className="text-xl font-black uppercase tracking-tighter">Current Bank Content</h4>
                </div>
                <div className="divide-y divide-gray-100 p-8 space-y-8">
                  {customExams.find(e => e.id === selectedExamId)?.questions.map((q, i) => (
                    <div key={i} className="group">
                      <div className="text-[10px] font-black text-blue-600 mb-2 uppercase">Question {i+1}</div>
                      <p className="font-bold text-gray-800 text-lg">{q.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
              <h3 className="text-3xl font-black text-green-900">Grading Repository</h3>
              <input className="w-full md:w-96 px-6 py-3 rounded-2xl border-2 border-gray-50 focus:border-green-800 transition-all font-bold text-sm" placeholder="Filter by Name or Course..." value={resultFilter} onChange={e => setResultFilter(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b-4 border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr><th className="pb-6 px-4">Candidate Identity</th><th className="pb-6 px-4">Course</th><th className="pb-6 px-4 text-center">Score</th><th className="pb-6 px-4 text-right">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.filter(r => r.userName.toLowerCase().includes(resultFilter.toLowerCase()) || r.examCode.toLowerCase().includes(resultFilter.toLowerCase())).map((res, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-6 px-4"><div className="font-bold text-gray-900">{res.userName}</div><div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{res.matric}</div></td>
                      <td className="py-6 px-4 font-black text-green-800">{res.examCode}</td>
                      <td className="py-6 px-4 text-center"><div className="text-2xl font-black text-gray-800">{res.percentage}%</div><div className="text-[10px] font-black uppercase text-green-600">Grade {res.grade.grade}</div></td>
                      <td className="py-6 px-4 text-right text-xs font-bold text-gray-400">{new Date(res.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pending_approvals' && (
          <div className="max-w-5xl mx-auto animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
               <div className="p-10 bg-yellow-400 text-green-950 flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Academic Dispatcher</h3>
                 <span className="bg-white/30 text-green-950 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">{customExams.filter(e => e.status === 'pending').length} PAPERS PENDING</span>
               </div>
               <div className="divide-y divide-gray-100">
                 {customExams.filter(e => e.status === 'pending').map(ex => (
                   <div key={ex.id} className="p-10 flex flex-col md:flex-row justify-between items-center gap-8 hover:bg-gray-50 transition-all">
                      <div className="flex-grow">
                         <h4 className="text-2xl font-black text-gray-900 leading-none mb-2">{ex.code}: {ex.title}</h4>
                         <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <span>📋 {ex.questions.length} Questions</span>
                            <span>⏱️ {ex.duration} Minutes</span>
                         </div>
                      </div>
                      <button onClick={() => handlePublishExam(ex.id)} className="px-10 py-4 ausu-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Approve & Publish</button>
                   </div>
                 ))}
                 {customExams.filter(e => e.status === 'pending').length === 0 && <div className="p-32 text-center text-gray-400 font-black uppercase tracking-widest text-xs italic">No papers awaiting dispatch.</div>}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-3xl font-black text-green-900 mb-8 uppercase tracking-tighter">University Academic Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100">
                  <h4 className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-4">Overall Success Rate</h4>
                  <div className="text-5xl font-black text-green-900">{results.length > 0 ? (results.filter(r => r.grade.grade !== 'F').length / results.length * 100).toFixed(1) : 0}%</div>
                  <p className="text-xs font-bold text-green-700 mt-2 uppercase">Students Passing Exams</p>
                </div>
                <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
                  <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-4">Global Participation</h4>
                  <div className="text-5xl font-black text-blue-900">{results.length}</div>
                  <p className="text-xs font-bold text-blue-700 mt-2 uppercase">Total Assessments Taken</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;

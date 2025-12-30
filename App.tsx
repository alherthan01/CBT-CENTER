
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { User, Exam, ExamResult } from './types';
import { MOCK_USERS, COLORS } from './constants';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';

// Components
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('ausu_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('ausu_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ausu_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        {user && <Navbar user={user} onLogout={logout} />}
        
        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route path="/" element={!user ? <LoginPage onLogin={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/exam/:examId" element={user ? <ExamPage user={user} /> : <Navigate to="/" />} />
            <Route path="/results" element={user ? <ResultsPage user={user} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
};

export default App;


import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API delay
    setTimeout(() => {
      const foundUser = MOCK_USERS.find(u => 
        (u.email === username || u.matric === username) && u.role === role
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Invalid credentials or role combination. For demo, use Ahmed Musa\'s email or matric with "student" role.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto mt-12 mb-20">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 ausu-gradient"></div>
        
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <img 
              src="https://www.au.edu.ng/wp-content/uploads/2021/04/logo.png" 
              alt="AUSU Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-green-900">AUSU Login</h2>
          <p className="text-sm text-gray-500 font-medium">Enter your university credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-medium animate-pulse">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Matric Number / Email
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. AUS/2023/CSC/001"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-green-800 focus:outline-none transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-green-800 focus:outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Login Role
            </label>
            <select 
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-green-800 focus:outline-none transition-colors appearance-none bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 ausu-gradient text-white rounded-lg font-bold shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : 'Login to AUSU CBT'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-500 leading-relaxed italic">
            <strong>Important:</strong> Ensure you have a stable internet connection and you are in a quiet, proctored environment before beginning any examination.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button className="bg-white border-2 border-gray-100 p-4 rounded-xl text-center hover:border-green-800 transition-colors group">
          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">💻</div>
          <div className="text-xs font-bold text-gray-700">ICT Support</div>
        </button>
        <button className="bg-white border-2 border-gray-100 p-4 rounded-xl text-center hover:border-green-800 transition-colors group">
          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📅</div>
          <div className="text-xs font-bold text-gray-700">Exam Schedule</div>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;

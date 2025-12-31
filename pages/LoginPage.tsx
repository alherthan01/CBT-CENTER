
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
        setError('Invalid credentials or role combination. Use a valid student matric or staff email.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 ausu-gradient"></div>
        
        <div className="text-center mb-8">
          <img 
            src="https://www.au.edu.ng/wp-content/uploads/2021/04/logo.png" 
            alt="AUSU Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-green-900">Portal Login</h2>
          <p className="text-sm text-gray-500 mt-1">Al'Istiqama University Sumaila</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              REG. NO / EMAIL
            </label>
            <input 
              type="text" 
              required
              placeholder="Matric No. / Email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-800 focus:border-transparent outline-none transition-all text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Secure Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-800 focus:border-transparent outline-none transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Login As
            </label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-800 focus:border-transparent outline-none transition-all text-sm bg-white"
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
            className={`w-full py-4 ausu-gradient text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-md transition-all active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {isLoading ? 'Verifying...' : 'Login to Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
            Integrity • Excellence • Service
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
          <div className="text-xl mb-1">🛡️</div>
          <div className="text-[10px] font-bold text-gray-500 uppercase">Secure</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
          <div className="text-xl mb-1">📞</div>
          <div className="text-[10px] font-bold text-gray-500 uppercase">Support</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
